PYTHON ?= python3
VENV ?= .venv

.PHONY: setup backend-dev frontend-dev lint test

setup:
	$(PYTHON) -m venv $(VENV)
	. $(VENV)/bin/activate && pip install --upgrade pip && pip install -e ".[dev]"
	cd frontend && npm install

backend-dev:
	. $(VENV)/bin/activate && uvicorn backend.app.main:app --reload

frontend-dev:
	cd frontend && npm run dev

lint:
	. $(VENV)/bin/activate && ruff check backend && ruff format --check backend && mypy backend/app && bandit -r backend/app
	cd frontend && npm run lint

test:
	. $(VENV)/bin/activate && pytest backend/tests
	cd frontend && npm run test
