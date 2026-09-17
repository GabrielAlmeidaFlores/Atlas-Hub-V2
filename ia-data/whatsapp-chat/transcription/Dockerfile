FROM python:3.11-slim-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# requests is required by faster-whisper but not always pulled as a hard dep
RUN pip install --no-cache-dir \
    "faster-whisper==1.1.1" \
    "requests>=2.31.0" \
    "huggingface_hub>=0.23.0"

WORKDIR /work
COPY transcribe_one.py /usr/local/bin/transcribe_one.py

ENTRYPOINT ["python", "/usr/local/bin/transcribe_one.py"]
