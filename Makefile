up:
docker compose up --build

down:
docker compose down

logs:
docker compose logs -f

restart:
docker compose down && docker compose up --build

frontend:
docker compose exec frontend sh

backend:
docker compose exec backend sh

ai:
docker compose exec ai-service sh
