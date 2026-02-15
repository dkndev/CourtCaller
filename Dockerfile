# Multi-stage build for Vue.js frontend and Python backend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the Vue app
RUN npm run build

# Python backend stage
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the built frontend from the builder stage
COPY --from=frontend-builder /app/dist ./dist

# Copy Python server
COPY tts_server.py .

# Expose port
EXPOSE 5000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb

# Run the server
CMD ["python", "tts_server.py"]
