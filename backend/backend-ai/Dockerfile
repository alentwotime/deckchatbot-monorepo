# Stage 1 - build dependencies and export requirements
FROM python:3.10-slim AS builder
WORKDIR /app
RUN pip install --no-cache-dir poetry
COPY pyproject.toml poetry.lock ./
RUN poetry export --without-hashes --only main -f requirements.txt -o requirements.txt

# Stage 2 - runtime image
FROM python:3.10-slim
WORKDIR /app
COPY --from=builder /app/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "API.api:app", "--host", "0.0.0.0", "--port", "8000"]
