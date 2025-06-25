# Project Agent Instructions

## 📁 Structure

* `/backend`: Django or FastAPI backend service
* `/frontend`: React or Next.js client (written in TypeScript)
* `/docker`: Dockerfiles and `docker-compose.yml` for local and CI builds

## 📐 Conventions

* Use **2-space indentation** for all JSON and YAML files
* React components should be written in **TSX**, documented with **JSDoc**
* Branches must follow naming convention: `feat/<name>` or `fix/<name>`

## ✅ Testing

* Run backend tests locally without Docker:

  ```bash
  npm test
  ```
* Run linters before pushing:

  ```bash
  docker-compose run backend flake8
  docker-compose run frontend eslint .
  ```
* Format before committing (`black`, `prettier`, etc.)

## 🐳 Docker Workflow

* Build all services locally using:

  ```bash
  docker-compose -f docker/docker-compose.yml up --build
  ```
* Confirm all containers run correctly before committing changes


## 🔐 Environment Variables

* Use `.env.local` for local dev (never commit this)
* Define required env vars in `docker/.env.template` and sync with teammates

## ✅ Checklist Before Merge

* [ ] All tests pass via Docker
* [ ] ESLint and Flake8 pass clean
* [ ] Branch is rebased and named correctly

---

This file helps ensure consistent agent behavior across local, CI, and cloud deployments. Treat it as source-of-truth for automation.
