from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Deckbot AI backend is alive!"}