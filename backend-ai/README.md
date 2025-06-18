# DeckChatbot AI Backend

Python FastAPI backend with AI integrations for deck planning and material calculation.

## Development

```bash
poetry install
uvicorn API.api:app --reload
```

### Endpoints

- `GET /` health check
- `POST /predict` run the local LLaVA model on an uploaded image

