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


# deckchatbot-ai-backend

## Fine‑tuning LLaVA‑LLaMA3

To fine‑tune the vision‑capable LLaVA‑LLaMA3 model on the ShareGPT4V and InternVL datasets,
see the detailed instructions in `fine_tuning/README.md`.
