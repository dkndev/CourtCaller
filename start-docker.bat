@echo off
REM CourtCaller Docker Startup Script for Windows

echo.
echo 🚀 CourtCaller Docker Startup
echo ==============================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is not installed!
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is not running!
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️  No .env file found!
    echo Creating .env from .env.example...
    copy .env.example .env
    echo ✅ Created .env file
    echo.
    echo ⚠️  IMPORTANT: Edit .env and add your ELEVENLABS_API_KEY
    echo    Then run this script again
    pause
    exit /b 1
)

REM Check if API key is set
findstr /C:"your_api_key_here" .env >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Please edit .env and add your ELEVENLABS_API_KEY
    echo    Get your API key from: https://elevenlabs.io/app/api-keys
    pause
    exit /b 1
)

echo ✅ Docker is ready
echo ✅ .env file configured
echo.

set /p REBUILD="Do you want to rebuild the image? (y/N): "
if /i "%REBUILD%"=="y" (
    echo 🔨 Building Docker image...
    docker-compose build --no-cache
)

echo.
echo 🚀 Starting CourtCaller...
docker-compose up -d

echo.
echo ✅ CourtCaller is running!
echo.
echo 📱 Open in your browser: http://localhost:5000
echo.
echo 📋 View logs:    docker-compose logs -f
echo 🛑 Stop server:  docker-compose down
echo 🔄 Restart:      docker-compose restart
echo.
pause
