# ---- Base image ----
FROM python:3.11-slim

# ---- Workdir ----
WORKDIR /app

# ---- Install deps (FastAPI + your deps) ----
# If you have a requirements.txt, COPY it first for caching:
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# ---- Copy app code ----
COPY . .

# ---- Expose port ----
EXPOSE 7860

# ---- Start server ----
# HuggingFace Spaces prefers uvicorn on port 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
