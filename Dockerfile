# Use official Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose port 8000 for Azure App Service
RUN adduser --system appuser
USER appuser
ENV PORT=8000
EXPOSE ${PORT}

# Start FastAPI app with uvicorn on container start
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "${PORT}"]
