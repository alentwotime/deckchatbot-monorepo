# Use official Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose port 8000 for Azure App Service
ENV PORT=8000
EXPOSE ${PORT}

# Start FastAPI app with uvicorn on container start
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "${PORT}"]
