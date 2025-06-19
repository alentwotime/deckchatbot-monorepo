FROM python:3.10-slim
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir poetry && poetry install --no-root --only main
CMD ["poetry", "run", "uvicorn", "API.api:app", "--host", "0.0.0.0", "--port", "8000"]

