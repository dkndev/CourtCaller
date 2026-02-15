# CourtCaller

A Vue 3 + Vite application for managing badminton court scheduling with integrated ElevenLabs TTS for announcements.

## Quick Start

### Option 1: Docker (Recommended)

#### Prerequisites
- Docker and Docker Compose installed

#### Setup

1. **Get an ElevenLabs API Key**
   - Sign up at [elevenlabs.io](https://elevenlabs.io)
   - Go to [API Keys](https://elevenlabs.io/app/api-keys)
   - Copy your API key

2. **Create `.env` file**
   ```sh
   cp .env.example .env
   ```
   
   Edit `.env` and add your API key:
   ```
   ELEVENLABS_API_KEY=your-api-key-here
   ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
   ```

3. **Build and run with Docker Compose**
   ```sh
   docker-compose up -d
   ```

4. **Access the application**
   Open `http://localhost:5000` in your browser

5. **View logs**
   ```sh
   docker-compose logs -f
   ```

6. **Stop the application**
   ```sh
   docker-compose down
   ```

#### Updating the Application
```sh
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Option 2: Local Development

#### Prerequisites
- Node.js 20.19+ or 22.12+
- Python 3.11+

### 1. Get an ElevenLabs API Key

1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Go to [API Keys](https://elevenlabs.io/app/api-keys)
3. Copy your API key

### 2. Install Dependencies

**Frontend:**
```sh
npm install
```

**Backend:**
```sh
pip install -r requirements.txt
```

### 3. Set Environment Variables

Create `.env` file:
```sh
cp .env.example .env
```

Edit `.env`:
```
ELEVENLABS_API_KEY=your-api-key-here
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
```

### 4. Run Development Servers

**Terminal 1 - Backend:**
```sh
python tts_server.py
```

**Terminal 2 - Frontend:**
```sh
npm run dev
```

Open `http://localhost:5173` in your browser.

### 5. Production Build

```sh
npm run build
python tts_server.py
```

Open `http://localhost:5000` in your browser.

## Configuration

### ElevenLabs Voice IDs

You can change the voice by updating `VITE_ELEVENLABS_VOICE_ID` in `.env.local`:

```
VITE_ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
```

Popular free voices:
- `pNInz6obpgDQGcFmaJgB` - Adam (male)
- `EXAVITQu4vr4xnSDxMaL` - Bella (female, requires paid subscription)
- `nPczCjzI2devNBz1zQrb` - Brian (male, requires paid subscription)

See [ElevenLabs Voices](https://elevenlabs.io/docs/voices) for more options.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).
