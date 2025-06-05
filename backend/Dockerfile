# Stage 1: Builder
FROM python:3.10-slim AS builder

WORKDIR /app

# Install system dependencies needed to build some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc \
    libpq-dev python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements early to leverage Docker cache
COPY requirements.txt .

# Install dependencies locally to avoid polluting global site-packages
RUN pip install --user --no-cache-dir --upgrade pip \
    && pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Final Image
FROM python:3.10-slim

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Create backend directory to match the structure expected by imports
RUN mkdir -p /app/backend

# Make sure Python can find your app modules
ENV PYTHONPATH=/app

# Copy all source code into the backend directory
COPY . /app/backend/

# For production, start the FastAPI server without hot reload
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
