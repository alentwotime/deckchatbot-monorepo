FROM python:3.11-slim

WORKDIR /app

# Install tesseract OCR engine
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        build-essential \
        tesseract-ocr \
        libtesseract-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Poetry
COPY pyproject.toml poetry.lock ./
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    ln -s /root/.local/bin/poetry /usr/local/bin/poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-root

# Copy the rest of your app
COPY . /app

EXPOSE 11434

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "11434"]
