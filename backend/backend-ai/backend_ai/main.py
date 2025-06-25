from fastapi import FastAPI
from api.routes import analyze

app = FastAPI()
app.include_router(analyze.router)

@app.get("/")
def root():
    return {"message": "Deckbot AI backend is alive!"}


@app.get("/health")
def health():
    """Health check endpoint used by Docker."""
    return {"status": "backend OK"}

