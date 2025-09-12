# Backend Dockerfile for FastAPI app
# Multi-stage to keep runtime slim
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (curl for health/debug). Pillow wheels are prebuilt so no build deps required.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip \
    && pip install -r /app/requirements.txt

# Copy app source
COPY backend/app /app/app
COPY backend/media /app/media

# Create non-root user
RUN useradd -ms /bin/bash appuser \
    && chown -R appuser:appuser /app

USER appuser

ENV HOST=0.0.0.0 \
    PORT=8000

EXPOSE 8000

# Default command runs Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
