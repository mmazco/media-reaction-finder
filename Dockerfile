# Use Python base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire app (including pre-built frontend assets)
COPY . .

# Expose port (Railway will set PORT env var)
ENV PORT=8080
EXPOSE 8080

# Start command using shell form to expand $PORT
CMD gunicorn app:app --bind 0.0.0.0:$PORT
