#!/usr/bin/env python3
import os
import requests
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from elevenlabs import ElevenLabs

app = Flask(__name__, static_folder='dist', static_url_path='')
CORS(app)

# ElevenLabs configuration
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY', '')
ELEVENLABS_VOICE_ID = os.getenv('ELEVENLABS_VOICE_ID', 'JBFqnCBsd6RMkjVDRZzb')

# Initialize ElevenLabs client (optional; can also be overridden per request)
elevenlabs = ElevenLabs(api_key=ELEVENLABS_API_KEY) if ELEVENLABS_API_KEY else None

@app.route('/api', methods=['POST'])
def synthesize():
    """TTS endpoint - accepts text and synthesis parameters"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        speed = float(data.get('speed', 1.0))
        api_key = (data.get('api_key') or '').strip()
        voice_id = (data.get('voice_id') or '').strip() or ELEVENLABS_VOICE_ID

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        client = None
        if api_key:
            client = ElevenLabs(api_key=api_key)
        else:
            client = elevenlabs

        if not client:
            return jsonify({'error': 'No ElevenLabs API key configured'}), 400

        # Clamp speed between 0.5 and 2.0
        speed = max(0.5, min(2.0, speed))

        # Generate speech using ElevenLabs
        audio = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id='eleven_turbo_v2_5', # eleven_multilingual_v2 , eleven_turbo_v2_5 (50% cheaper)
            output_format='mp3_44100_128',
            language_code='nl'
        )

        # Convert to bytes
        audio_bytes = b''.join(audio)

        # Return audio as MP3
        return audio_bytes, 200, {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': 'inline'
        }

    except Exception as e:
        print(f"TTS Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/scrape-matches', methods=['POST'])
def scrape_matches():
    """Scrape matches from badmintonvlaanderen.be"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()

        if not url:
            return jsonify({'error': 'No URL provided'}), 400

        # Fetch the page
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')

        # Find all match rows - looking for table rows with match data
        matches = []

        # Look for the matches table
        table = soup.find('table', {'class': 'matches'}) or soup.find('table')
        if not table:
            return jsonify({'error': 'Could not find matches table on page'}), 400

        rows = table.find_all('tr')[1:]  # Skip header row

        for row in rows:
            cells = row.find_all('td', recursive=False)
            if len(cells) < 3:
                continue

            # Skip matches that have scores (already completed)
            score_span = row.find('span', {'class': 'score'})
            if score_span and score_span.get_text(strip=True):
                continue

            try:
                import re

                def _clean_player_name(name: str) -> str:
                    name = (name or '').strip()
                    name = re.sub(r'\s*\[\d+\]\s*$', '', name)
                    return name.strip()

                def _extract_team_names(team_td):
                    if not team_td:
                        return []
                    links = team_td.find_all('a')
                    names = []
                    for link in links:
                        href = link.get('href', '') or ''
                        if 'player.aspx' not in href:
                            continue
                        nm = _clean_player_name(link.get_text(strip=True))
                        if nm:
                            names.append(nm)
                    return names

                # Time is reliably in td.plannedtime
                time_td = row.find('td', {'class': 'plannedtime'})
                time_text = time_td.get_text(strip=True) if time_td else ''

                # Discipline/level is the draw link text (e.g. "HE 1-2")
                disc_link = row.find('a', href=re.compile(r'draw\.aspx'))
                disc_level_text = disc_link.get_text(strip=True) if disc_link else ''
                discipline = 'HD'  # Default
                level = 'Recreatief'  # Default

                if 'HE' in disc_level_text:
                    discipline = 'HE'
                elif 'HD' in disc_level_text:
                    discipline = 'HD'
                elif 'DE' in disc_level_text:
                    discipline = 'DE'
                elif 'DD' in disc_level_text:
                    discipline = 'DD'
                elif 'GD' in disc_level_text:
                    discipline = 'GD'

                level_match = re.search(r'(\d+(?:-\d+)?)', disc_level_text)
                if level_match:
                    level = level_match.group(1)

                # Find the <td> cells that contain player links; first is Team A, second is Team B.
                team_tds = []
                for td in cells:
                    if td.find('a', href=lambda h: h and 'player.aspx' in h):
                        team_tds.append(td)

                team_a_td = team_tds[0] if len(team_tds) >= 1 else None
                team_b_td = team_tds[1] if len(team_tds) >= 2 else None

                team_a_names = _extract_team_names(team_a_td)
                team_b_names = _extract_team_names(team_b_td)

                # Extract court number from court link
                # Examples: "Hoofdlocatie - B6" -> 6, "Complexe sportif de Walhain - 1" -> 1
                court = ''
                court_link = row.find('a', href=re.compile(r'court\.aspx'))
                if court_link:
                    location_text = court_link.get_text(strip=True)
                    # Try multiple patterns:
                    # 1. Number after dash and optional B: "- B6", "- 1"
                    court_match = re.search(r'-\s*[Bb]?(\d+)\s*$', location_text)
                    if court_match:
                        court = int(court_match.group(1))
                    else:
                        # 2. Just B followed by number: "B6"
                        court_match = re.search(r'[Bb](\d+)', location_text)
                        if court_match:
                            court = int(court_match.group(1))
                        else:
                            # 3. Any standalone number at the end
                            court_match = re.search(r'(\d+)\s*$', location_text)
                            if court_match:
                                court = int(court_match.group(1))

                # Create match entry
                match_id = f'{time_text}-{discipline}-{"-".join(team_a_names)}'
                matches.append({
                    'id': match_id,
                    'matchNumber': time_text,
                    'time': time_text,
                    'court': court,
                    'teamA': {
                        'names': team_a_names if team_a_names else ['Team A'],
                        'discipline': discipline,
                        'levelLabel': level
                    },
                    'teamB': {
                        'names': team_b_names if team_b_names else ['Team B'],
                        'discipline': discipline,
                        'levelLabel': level
                    }
                })
            except Exception as e:
                print(f"Error parsing row: {e}")
                import traceback
                traceback.print_exc()
                continue

        if not matches:
            return jsonify({'error': 'No matches found in table'}), 400

        return jsonify({'matches': matches}), 200

    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Failed to fetch URL: {str(e)}'}), 400
    except Exception as e:
        print(f"Scraping error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health():
    return jsonify({
        'status': 'ok',
        'tts_provider': 'elevenlabs',
        'voice_id': ELEVENLABS_VOICE_ID
    })

@app.route('/')
def index():
    return send_from_directory('dist', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path and os.path.exists(os.path.join('dist', path)):
        return send_from_directory('dist', path)
    return send_from_directory('dist', 'index.html')

if __name__ == '__main__':
    print("\n🚀 Starting TTS server on http://localhost:5000")
    print(f"📢 Voice: {ELEVENLABS_VOICE_ID}")
    app.run(host='0.0.0.0', port=5000, debug=False)
