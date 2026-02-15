# Docker Deployment Guide for CourtCaller

## Prerequisites

Make sure Docker and Docker Compose are installed on your system:

### Install Docker Desktop

**macOS:**
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify installation: `docker --version`

**Linux:**
```sh
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
sudo systemctl enable docker
```

**Windows:**
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify installation: `docker --version`

## Quick Start

### 1. Setup Environment Variables

Create a `.env` file:
```sh
cp .env.example .env
```

Edit `.env` and add your ElevenLabs API key:
```
ELEVENLABS_API_KEY=sk_your_actual_api_key_here
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
```

### 2. Build and Run

```sh
docker-compose up -d
```

This will:
- Build the Vue.js frontend
- Package it with the Python backend
- Start the server on port 5000

### 3. Access the Application

Open your browser to: **http://localhost:5000**

## Docker Commands

### View Logs
```sh
docker-compose logs -f
```

### Stop the Application
```sh
docker-compose down
```

### Restart the Application
```sh
docker-compose restart
```

### Rebuild After Code Changes
```sh
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Check Container Status
```sh
docker-compose ps
```

## Alternative: Build Docker Image Manually

### Build the Image
```sh
docker build -t courtcaller:latest .
```

### Run the Container
```sh
docker run -d \
  --name courtcaller \
  -p 5000:5000 \
  -e ELEVENLABS_API_KEY=your_api_key_here \
  -e ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb \
  courtcaller:latest
```

### View Logs
```sh
docker logs -f courtcaller
```

### Stop and Remove
```sh
docker stop courtcaller
docker rm courtcaller
```

## Production Deployment

### Deploy to a Server

1. **Copy files to server:**
   ```sh
   scp -r . user@server:/path/to/courtcaller
   ```

2. **SSH into server:**
   ```sh
   ssh user@server
   cd /path/to/courtcaller
   ```

3. **Create .env file with production values**

4. **Start the application:**
   ```sh
   docker-compose up -d
   ```

### Environment Variables for Production

Edit your `.env` file:
```
ELEVENLABS_API_KEY=your_production_api_key
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
```

### Using a Reverse Proxy (Optional)

If you want to run on port 80/443 with a domain name, use nginx or traefik:

**Example nginx configuration:**
```nginx
server {
    listen 80;
    server_name courtcaller.example.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Container Won't Start
```sh
docker-compose logs
```

### Port Already in Use
Change the port in `docker-compose.yml`:
```yaml
ports:
  - "8080:5000"  # Change 8080 to any available port
```

### Rebuild After Changes
```sh
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Clear All Docker Data
```sh
docker-compose down -v
docker system prune -a
```

## File Structure

```
CourtCaller/
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Docker Compose configuration
├── .dockerignore          # Files to exclude from Docker build
├── .env.example           # Environment variables template
├── .env                   # Your actual environment variables (create this)
├── tts_server.py          # Python backend
├── package.json           # Node.js dependencies
├── requirements.txt       # Python dependencies
└── src/                   # Vue.js frontend source
```

## What's Included

The Docker image includes:
- ✅ Vue.js frontend (production build)
- ✅ Python Flask backend
- ✅ ElevenLabs TTS integration
- ✅ All dependencies
- ✅ Ready to run on any system with Docker

## Benefits of Docker

- **Consistency**: Runs the same everywhere (dev, staging, production)
- **Easy deployment**: One command to start everything
- **Isolation**: Doesn't interfere with other applications
- **Easy updates**: Just rebuild and restart
- **Portability**: Deploy anywhere Docker runs
