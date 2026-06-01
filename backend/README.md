# Backend Service

This service is the Django 5.2 backend for the template. It handles authentication, account management, patch/version feeds, contact form delivery, logging, cache-backed verification tokens, Celery jobs, and the API surface consumed by the frontend.

## What this backend includes

- Cookie-based JWT authentication with httpOnly access and refresh tokens
- Email verification, password reset, password change, and account deletion flows
- Profile read/update/delete endpoints for authenticated users
- Public sitemap output for indexable pages
- Contact form handling with HTML email delivery to the configured admin address
- Patch/version storage and lookup backed by JSON seed files
- Centralized error handling, request logging, rate limiting, and cache helpers
- Celery worker and Celery Beat support
- A Channels ASGI entrypoint with websocket support scaffolded for future expansion

## Project Layout

| Path | Purpose |
| --- | --- |
| `backend/settings.py` | Django configuration, REST framework auth, cache, Celery, CORS, and rate limiting setup |
| `backend/asgi.py` | ASGI application entrypoint for Daphne and Channels |
| `backend/celery.py` | Celery application bootstrap |
| `backend/logging_config.py` | Rotating log configuration for Django, API, Celery, security, and DB logs |
| `backend/ratelimit_config.py` | Central rate-limit definitions |
| `backend/cache_system.py` | Legacy/shared cache helper with `app_cache`, `session_cache`, and `page_cache` instances |
| `api/` | Public API endpoints for sitemap, contact, patch feed, and admin checks |
| `usermanagement/` | Custom auth model, auth views, serializers, and session helpers |
| `utils/` | Shared utilities for mail, error handling, encryption, cache, permissions, sanitization, and websocket consumer scaffolding |
| `patches/` | JSON patch seed files synced into the database |
| `email_templates/` | HTML email templates used by account verification flows |

## How It Works

### Authentication

The backend uses the custom `AuthAcc` user model from `usermanagement/models.py` and cookie-based JWT auth.

- `register` creates a new user, validates email/username/password rules, and sends an email verification code.
- `login` only succeeds for verified accounts and sets `refresh_token` and `access_token` cookies.
- `CookieJWTAuthenticationMiddleware` mirrors the access token cookie into the request header so DRF can authenticate requests using cookies.
- `get_access_token` refreshes the access token cookie from the refresh token cookie.
- `logout` blacklists the refresh token when possible and clears auth cookies.

### Account Lifecycle

The frontend and backend share the same verification-code flow for multiple actions:

- Email verification
- Password reset
- Password change
- Account deletion

The code is stored in the verification cache with a 10-minute timeout and is tracked through `VerificationToken` in `usermanagement/models.py`.

### Profile Management

The authenticated profile endpoint supports:

- `GET` to load the current profile
- `PATCH` to update the username
- `DELETE` to delete the account after code confirmation

Password changes and account deletions revoke outstanding refresh tokens through `revoke_user_sessions`.

### Contact Form

`api/views/general.py` exposes a contact endpoint that:

- Validates the incoming fields
- Validates the sender email address
- Sends an email to the configured admin address
- Sends a confirmation email back to the user

### Patch and Version Feed

Patch data is stored in `backend/patches/*.json` and synced into the database through the `sync_patches` management command.

- `Patch` enforces semantic versioning and requires `added`, `improved`, and `fixed` sections in the `changes` payload
- `patches_list` returns ordered patch summaries
- `patches_detail` returns a single patch by semantic version string

### Logging, Cache, and Error Handling

- `utils/error_handler.py` standardizes success and error responses
- `backend/middleware.py` logs request timing, status, user, path, and client IP
- `backend/logging_config.py` writes rotating logs to `backend/logs/`
- `utils/cache.py` provides a dict-like wrapper over Django cache and powers verification tokens
- `backend/cache_system.py` keeps the older cache helper with extra global cache instances
- `utils/encryption.py` provides Fernet encryption and decryption helpers
- `utils/mail.py` renders email templates and sends SMTP mail
- `utils/permissions.py` provides `IsStaff`, `IsAdmin`, and `APIKeyPermission`
- `utils/sanitizer.py` provides input and payload sanitizers for text, JSON, audio, and grade-level data

## Public API Surface

Base URL: `/api/`

| Method | Path | What it does |
| --- | --- | --- |
| `POST` | `/auth/register/` | Register a new account and send a verification email |
| `POST` | `/auth/login/` | Verify credentials and set auth cookies |
| `POST` or `GET` | `/auth/logout/` | Log out, blacklist refresh tokens when available, and clear cookies |
| `GET` | `/auth/verify/` | Confirm email verification with `email`, `code`, and `reason` query params |
| `POST` | `/auth/verify/resend/` | Resend the email verification code |
| `POST` | `/auth/password/reset/request/` | Send a reset code to the provided email |
| `POST` | `/auth/password/reset/confirm/` | Reset the password with email, code, and a new password |
| `POST` | `/auth/password/change/request/` | Send a password change code to the signed-in user |
| `POST` | `/auth/password/change/confirm/` | Change the signed-in user password after code confirmation |
| `GET` / `PATCH` / `DELETE` | `/auth/user/profile/` | Read, update, or delete the authenticated account |
| `POST` | `/auth/user/profile/delete/request/` | Send an account deletion verification code |
| `POST` or `GET` | `/auth/token/refresh/` | Refresh the access token cookie |
| `POST` or `GET` | `/auth/user/authenticated/` | Return the authenticated user payload |
| `GET` | `/patches/` | Return all patches in semantic order |
| `GET` | `/patches/<version>/` | Return one patch by version string |
| `POST` | `/contact/` | Send a contact form email to the configured admin address |
| `GET` | `/is_admin/` | Return whether the signed-in user is staff or superuser |
| `GET` | `/sitemap.xml` | Return an XML sitemap for public routes |

## Workers and Runtime Commands

### Docker / Compose

The backend container uses this startup chain from `backend/Dockerfile`:

```bash
python manage.py migrate --noinput
python manage.py sync_patches
daphne -b 0.0.0.0 -p 8000 backend.asgi:application
```

The compose file also starts:

- `celery` with `celery -A backend worker --loglevel=info`
- `celery-beat` with `celery -A backend beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler`

### Management Commands

The repo already includes or relies on these commands:

- `python manage.py check`
- `python manage.py migrate`
- `python manage.py createsuperuser`
- `python manage.py test`
- `python manage.py sync_patches`
- `python manage.py runserver` for local Django dev if you want to bypass Docker

`sync_patches` scans `backend/patches/*.json`, parses semantic versions, normalizes the `changes` sections, and creates missing `Patch` rows without overwriting existing database records.

## Environment Variables

Key backend settings consumed by the code:

| Variable | Used for |
| --- | --- |
| `APP_NAME` | Branding in responses and emails |
| `DEBUG` | Debug mode, secure cookie behavior, and logging verbosity |
| `SECRET_KEY` | Django secret key |
| `ALLOWED_HOSTS` | Allowed host list |
| `BASE_URL` | Backend email and link generation |
| `FRONTEND_URL` | Verification links that point back to the frontend |
| `DATABASE_URL` | Database configuration |
| `REDIS_URL` | Django cache backend location |
| `CELERY_BROKER_URL` | Celery broker and result backend |
| `ADMIN_EMAIL` | Contact form destination |
| `EMAIL` / `EMAIL_PASS` | SMTP sender credentials |
| `EMAIL_HOST` / `EMAIL_PORT` | SMTP connection settings |
| `ENCRYPTION_KEY` | Fernet encryption key |
| `CACHE_PREFIX` | Cache key prefix |
| `SEO_CANONICAL_BASE_URL` | Canonical sitemap URLs |
| `API_KEY` | Optional header-based API key permission |

## WebSocket Scaffolding

The repo includes the base consumer in `utils/consumer.py` and Channels dependencies, but the websocket router is intentionally empty in `backend/asgi.py`.

- `WSConsumer` provides `send_json`, `send_event`, `send_success`, `send_error`, and a built-in `ping` handler
- Add a real websocket routing module only when you introduce a finished realtime feature set

## Notes

- Logs are written to `backend/logs/` and are created automatically
- `backend/patches/0.0.1.json` is the sample patch record currently seeded into the system
- `backend/backend/cache_system.py` exists as a more expansive cache helper, but the auth token flow uses `utils/cache.py`
