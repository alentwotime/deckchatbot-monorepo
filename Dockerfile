# Use official Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose port 11434
EXPOSE 11434

# Start FastAPI app with uvicorn on container start
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "11434", "--reload"]
