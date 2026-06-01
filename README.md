# Full-Stack Template

A reusable full-stack starter with a Django backend, React frontend, PostgreSQL, Redis, Celery, and Docker Compose.

This root README is the quick entry point. Use the service docs for the full feature and API details:

- Backend service docs: `backend/README.md`
- Frontend service docs: `frontend/README.md`

## What lives here

- `backend/` - Django 5.2 API, auth flows, patch feed, contact form, Celery worker setup, and shared utilities
- `frontend/` - React 19 single-page app with the auth and account-management flows
- `docker-compose.yml` - Local orchestration for PostgreSQL, Redis, backend, Celery, frontend, and Nginx

## Quick Start

```bash
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py sync_patches
docker compose exec backend python manage.py createsuperuser
```

## Service Commands

- Backend development and maintenance commands are documented in `backend/README.md`
- Frontend npm scripts are documented in `frontend/README.md`

## Runtime Topology

The compose stack starts:

- `db` - PostgreSQL 16
- `redis` - Redis 7 for cache and Celery broker usage
- `backend` - Django ASGI app served by Daphne
- `celery` - Background worker process
- `celery-beat` - Scheduled task runner
- `frontend` - Vite dev server
- `nginx` - Reverse proxy for HTTP/S traffic

## Notes

- Backend dependencies are managed with `uv`
- The frontend uses relative `/api` requests and Vite proxying during development
- WebSocket support is scaffolded in the backend, but no finished realtime route set is included yet
