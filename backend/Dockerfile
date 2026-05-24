FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PDF/OCR processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 1) CPU-only PyTorch first — saves ~2 GB vs the GPU variant (no NVIDIA CUDA libs).
#    sentence-transformers will pick this up as a satisfied dep and won't pull GPU torch.
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch

# 2) Pin bcrypt 4.0.1. bcrypt 4.1+ silently breaks passlib's verify
#    (login fails with no error). See mg.md > "Known Issues".
RUN pip install --no-cache-dir bcrypt==4.0.1

# 3) The rest of the requirements. Strip pip's wheel cache aggressively to keep
#    the image (and intermediate build layer) small enough for DO's build limits.
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir --force-reinstall bcrypt==4.0.1 && \
    rm -rf /root/.cache/pip

# 4) Remove the deprecated pinecone-plugin-inference + legacy pinecone-client.
#    The new pinecone>=6 refuses to import if these are present.
RUN pip uninstall -y pinecone-plugin-inference pinecone-client || true

COPY . .

EXPOSE 8000

# HuggingFace embeddings take 30-60s to load on first start. If your platform's
# health check probes /health, set its timeout/initial-delay to at least 90s.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
