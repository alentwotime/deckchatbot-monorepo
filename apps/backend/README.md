# DeckChatbot AI Backend

Backend REST API (FastAPI) for deck planning:

- **GET /** → `{ status: "ok" }`
- **POST /predict** → uploads a deck image, returns AI-generated layout + material estimate
🏷️ 2. Structured Quick‑Start Code Block
AI agents excel when given step-by-step, copy-paste-ready commands. Make sure yours are minimal and sequential:

bash
Copy
Edit

## Install dependencies

poetry install

## Run server

uvicorn API.api:app --reload

## Test health endpoint

[Check health endpoint](http://localhost:8000/health)
That clarity helps the AI parse the flow precisely .

📦 3. Show core concepts/code signature blocks
Codex works better when it knows what "predict" expects. Include short signatures:

python
Copy
Edit

## api/predict.py

def predict(image: UploadFile) -> DeckPrediction:
    """Input: image bytes; Output: JSON with layout, material list"""
Even a simple example of the JSON response will help AI understand expected data structures
DataCamp.com
.

🎯 4. Define usage and patterns
Include an actual example of calling /predict with curl or Python:

bash
Copy
Edit
curl -F 'file=@deck.png' [http://localhost:8000/predict](http://localhost:8000/predict)
OR in Python:

python
Copy
Edit
import requests

r = requests.post("[http://localhost:8000/predict](http://localhost:8000/predict)", files={"file": open("deck.png","rb")})
print(r.json())
This bridges the gap between vague docs and concrete code examples.

🧠 5. Explain fine-tuning context concisely
Since Codex might touch fine-tuning scripts, include:

md
Copy
Edit

## Fine-tuning

Run vision model fine-tuning:

1. Place ShareGPT4V + InternVL data in `fine_tuning/data`
2. Run `bash fine_tuning/train.sh` which invokes HuggingFace trainer
3. Outputs: `moel_fine_tuned.pt` loaded by `/predict`
