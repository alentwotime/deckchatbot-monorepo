# Use official Python 3.10 slim image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy dependency files
COPY poetry.lock pyproject.toml ./

# Install Poetry and dependencies (no root)
RUN pip install poetry && poetry config virtualenvs.create false && poetry install --no-root

# Copy backend source code
COPY . .

# Expose backend port
EXPOSE 8000

# Run the backend API with uvicorn
CMD ["uvicorn", "API.api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
