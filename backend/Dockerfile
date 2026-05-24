FROM python:3.11-slim

WORKDIR /app

# System dependencies for PDF/OCR processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# requirements-lock.txt is generated from a working local venv via `pip freeze`.
# It pins every transitive dep so the production image matches local exactly.
# When you change dependencies: update locally, retest, regenerate the lock with
#   .\venv\Scripts\python.exe -m pip freeze > backend\requirements-lock.txt
# then commit + push.
COPY requirements-lock.txt .

# 1) CPU-only PyTorch first — saves ~2 GB vs the GPU variant (no NVIDIA CUDA libs).
#    sentence-transformers will see torch as satisfied and won't pull GPU torch.
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch

# 2) All other deps from the exact-pinned lock file. bcrypt==4.0.1 is already
#    pinned in the lock, so the previous "install bcrypt twice" dance is gone.
RUN pip install --no-cache-dir -r requirements-lock.txt && rm -rf /root/.cache/pip

# 3) Neutralise the deprecated `pinecone-plugin-inference` plugin that
#    pinecone-client 5.x drags in as a transitive dep. The new pinecone>=6
#    refuses to import if it can `import pinecone_plugins.inference`. We
#    delete only that one subdirectory; everything else stays.
RUN pip uninstall -y pinecone-plugin-inference 2>/dev/null; \
    rm -rf /usr/local/lib/python3.11/site-packages/pinecone_plugins/inference

# 4) Build-time sanity check. If pinecone has any import issue (e.g., the
#    deprecated-plugin guard re-appears), the BUILD fails here with a clear
#    message instead of crash-looping at runtime.
RUN python -c "from pinecone import Pinecone; print('OK: pinecone imports cleanly')"

COPY . .

EXPOSE 8000

# HuggingFace embeddings take 30-60s to load on first start. If your platform's
# health check probes /health, set its timeout/initial-delay to at least 90s.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
