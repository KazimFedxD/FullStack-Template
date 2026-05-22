FROM python:3.11-slim

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set workdir
WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y build-essential libpq-dev gcc ffmpeg \
    libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
    libgdk-pixbuf-xlib-2.0-0 libffi-dev shared-mime-info && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Run migrations and start ASGI server (Daphne) for WebSocket support
CMD python manage.py migrate --noinput && \
    python manage.py sync_patches && \
    daphne -b 0.0.0.0 -p 8000 backend.asgi:application
