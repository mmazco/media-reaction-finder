# Use Python base image
FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend and build
COPY frontend/ ./frontend/
RUN cd frontend && npm install && npm run build

# Copy the rest of the app
COPY . .

# Copy built frontend to root
RUN cp -r frontend/dist/* ./

# Expose port (Railway will set PORT env var)
ENV PORT=8080
EXPOSE 8080

# Start command using shell form to expand $PORT
CMD gunicorn app:app --bind 0.0.0.0:$PORT

