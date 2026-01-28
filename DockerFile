# Stage 1: Build the Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
#
COPY rag-db-app-frontend/package*.json ./
RUN npm install
COPY rag-db-app-frontend/ ./
RUN npm run build

# Stage 2: Backend & Final Image
FROM python:3.11-slim

# Create a non-root user for Hugging Face safety requirements
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:${PATH}"

WORKDIR /app

# Install system dependencies
USER root
RUN apt-get update && apt-get install -y \
	build-essential \
	libpq-dev \
	&& rm -rf /var/lib/apt/lists/*
USER user

#
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy application files
COPY --chown=user . .
COPY --from=frontend-builder --chown=user /app/frontend/dist ./static

# Hugging Face Spaces always listen on port 7860
EXPOSE 7860

# Run the app
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]