# 🚀 CourtCaller - Quick Reference

## Docker Commands

### Start Application
```bash
# Easy way (Mac/Linux)
./start-docker.sh

# Easy way (Windows)
start-docker.bat

# Manual way
docker-compose up -d
```

### Stop Application
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Restart Application
```bash
docker-compose restart
```

### Rebuild After Code Changes
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Check Status
```bash
docker-compose ps
```

## Access Points

- **Application:** http://localhost:5000
- **API Health:** http://localhost:5000/health
- **Scrape API:** http://localhost:5000/api/scrape-matches
- **TTS API:** http://localhost:5000/api

## Configuration

Edit `.env` file:
```
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
```

## Features

✅ 11 court buttons for quick assignment
✅ Auto-play announcements when clicking court numbers
✅ Matches cached in browser (persist across refreshes)
✅ Court assignments saved automatically
✅ Completed matches automatically hidden
✅ Dutch language TTS announcements

## Troubleshooting

### Port 5000 already in use?
Edit `docker-compose.yml` and change:
```yaml
ports:
  - "8080:5000"  # Use 8080 instead
```

### Container won't start?
```bash
docker-compose logs
```

### Fresh start?
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d
```

### Update dependencies?
```bash
docker-compose build --no-cache
```

## Development

For local development without Docker:

**Terminal 1 - Backend:**
```bash
python tts_server.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Open http://localhost:5173

## Production Deployment

1. Copy files to server
2. Create `.env` with production API key
3. Run `docker-compose up -d`
4. Access via http://your-server-ip:5000

## Support

For issues, check:
- Docker logs: `docker-compose logs -f`
- Browser console (F12)
- API health: http://localhost:5000/health
