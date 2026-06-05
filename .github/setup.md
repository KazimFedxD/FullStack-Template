# Setup Guide — `FullStack Template`

> **Purpose:** This file is an onboarding and configuration prompt for AI agents (GitHub Copilot, Claude Code, Cursor, ChatGPT, etc.) used to initialize a new project created from the `FullStack Template` repository.
>
> **Audience:** Future AI agents helping a human set up a fresh project from this template.
> **Owner action:** The human user supplies the answers; the AI agent performs only the documented edits.

You are an expert full-stack setup agent. Follow this guide exactly. Do not skip phases. Do not invent answers — if a value is unknown, ask the human.

---

## 0. Operating Principles

1. **Read the repository first.** Build an internal map of every configurable component before changing anything.
2. **Ask before assuming.** Use the `User Interview` block below; do not guess project name, domain, branding, or secrets.
3. **Only modify the files listed in `Setup Execution`.** All other files are part of the runtime contract and must remain untouched.
4. **Preserve conventions.** Keep the existing code style, formatting, ESLint flat config, logging standards, and Django app layout intact.
5. **Explain every change.** After each edit, briefly tell the user what was changed and why.
6. **Never commit secrets.** Leave real secrets out of `.env.example`; place them only in the untracked `.env` files.

---

## 1. Repository Understanding

Before asking any question, the AI agent MUST read and internalize:

### 1.1 Top-level map
- `README.md`, `INSTRUCTIONS.md`, `TODO.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `LICENSE` — current template copy that must be replaced.
- `docker-compose.yml` — orchestrates `db` (PostgreSQL 16), `redis` (Redis 7), `backend` (Django/ASGI), `celery`, `celery-beat`, `frontend` (Vite dev), `nginx` (reverse proxy on 80/443).
- `backend/` — Django 5.2 service (apps: `api`, `usermanagement`, `utils`; Django project package: `backend/`).
- `frontend/` — React 19 + Vite 7 SPA (ESM, Tailwind 4, Framer Motion, React Router 7).
- `nginx/nginx.conf` — proxies `/` → Vite, `/api/` and `/sitemap.xml` and `/robots.txt` → Django.
- `certs/` — empty; place TLS material here if running HTTPS locally.
- `.github/` — PR/issue templates, `instructions/` (logging and email template standards).
- `AI/`, `.website/` — developer notes and portfolio documentation; treat as reference only.

### 1.2 Backend (Django)
- `backend/backend/settings.py` reads every config from environment variables via `os.getenv` (with safe defaults) and `dj-database-url` for `DATABASE_URL`.
- `backend/backend/asgi.py` exposes the ASGI app (Daphne/Channels). `backend/backend/celery.py` configures Celery.
- `backend/backend/logging_config.py` writes rotating logs to `backend/logs/`.
- `backend/backend/middleware.py` provides `RequestLoggingMiddleware`.
- `backend/backend/ratelimit_config.py` centralizes rate limits (auth, profile, api).
- `backend/api/` — public endpoints (sitemap, robots, contact, patches, is_admin) and `Patch` model + `sync_patches` management command.
- `backend/usermanagement/` — custom user model `AuthAcc`, cookie-JWT middleware, register/login/logout/verify/reset/change/delete views, `VerificationToken` cache flow.
- `backend/utils/` — `mail` (SMTP), `error_handler`, `encryption` (Fernet), `permissions` (`IsStaff`, `IsAdmin`, `APIKeyPermission`), `cache`, `consumer` (Channels scaffolding), `sanitizer`.
- `backend/email_templates/` — `base.html` (shared CSS) and `verify_email.html` (used by `usermanagement` flows).
- `backend/patches/0.0.1.json` — sample patch record. `sync_patches` reads every `*.json` in this directory.
- `backend/requirements.txt` and `backend/pyproject.toml` declare all Python dependencies (managed with `uv`; `uv.lock` is checked in).

### 1.3 Frontend (React)
- `frontend/package.json` — name `fullstack-template-frontend`, scripts `dev` / `build` / `lint` / `preview`.
- `frontend/vite.config.js` — dev server on `0.0.0.0:5173`, proxies `/api` → `http://backend:8000`.
- `frontend/src/main.jsx` + `App.jsx` — React Router routes (`/`, `/login`, `/register`, `/verify`, `/forgot-password`, `/change-password`, `/profile`, `/logout`, `*`).
- `frontend/src/contexts/` — `AuthContext.jsx`, `MessageContext.jsx`.
- `frontend/src/utils/` — `auth.js` (endpoint map + helpers), `api.js` (fetch wrapper with retries/refresh), `cache.js`, `statePreservation.js`, `errorHandler.js`, `apiClient.js` (alternate client).
- `frontend/src/components/` — `AuthPageShell.jsx`, `ProtectedRoute.jsx`, `VerificationCodeInput.jsx`.
- `frontend/src/pages/` — `HomePage`, `LoginPage`, `RegisterPage`, `VerifyPage`, `ForgotPasswordPage`, `ChangePasswordPage`, `ProfilePage`, `NotFoundPage`.
- `frontend/public/` — contains leftover Create-React-App artifacts (`index.html` with "React App", `manifest.json`, `logo192.png`, `logo512.png`, `favicon.ico`, `robots.txt`) that must be replaced.
- `frontend/index.html` — Vite entry; `<title>` is `FullStack Template` and must be customized.
- `frontend/src/index.css` — Tailwind 4 dark theme baseline (no customization needed for setup).
- `frontend/eslint.config.js` — flat config; do not modify.
- `frontend/tailwind.config.js`, `frontend/postcss.config.js` — Tailwind/PostCSS config; do not modify.

### 1.4 Configurable components (the agent's checklist)
- Backend `APP_NAME`, `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `BASE_URL`, `FRONTEND_URL`, `DATABASE_URL`, `REDIS_URL`, `CACHE_PREFIX`, `CELERY_BROKER_URL`, `EMAIL_*`, `ADMIN_EMAIL`, `ENCRYPTION_KEY`, `API_KEY`, `SEO_CANONICAL_BASE_URL`, secure-cookie flags.
- Frontend `VITE_API_URL`, `VITE_APP_NAME`, `VITE_ENV`.
- Docker service names, container names, volume names, exposed ports.
- Nginx `server_name`, ports, upstream hosts.
- Branding: product name, tagline, nav copy, page title, logos/favicons, email-template footer copy, license owner/year.
- Auth model: `AUTH_USER_MODEL = "usermanagement.AuthAcc"` — keep unless the user explicitly requests a different model.
- Sitemap paths (`backend/api/views/general.py::SITEMAP_PUBLIC_PATHS`).
- Patch seed file(s) in `backend/patches/`.

---

## 2. User Interview

Ask the questions below, grouped and prioritized. Ask **only the questions needed** for the choices the human has not already made explicit.

### Group 1 — Identity (ask first)
1. **Project name** (e.g. `Acme Portal`). Used in: README titles, `APP_NAME`, `VITE_APP_NAME`, page `<title>`, nav badge, email footer, container names, package names, LICENSE.
2. **Short tagline / one-line description** (for README and home page).
3. **Long description** (1–3 sentences for `README.md`, `pyproject.toml`, `package.json`).
4. **Organization / company name** (for LICENSE copyright and any footer).
5. **Copyright year** (defaults to current year; confirm with the human).
6. **Primary domain** (e.g. `acme.example.com`) and any additional domains for `ALLOWED_HOSTS`.

### Group 2 — Deployment & environment
7. **Deployment target** — local Docker only, single VPS, Kubernetes, or a managed platform (Render/Fly/Railway/AWS). Affects HTTPS, `SECURE_SSL_REDIRECT`, cookie flags, backup strategy.
8. **Production vs development split** — do you want different `.env` files per environment? (Defaults: `backend/.env` for dev, `backend/.env.production` example commented in `INSTRUCTIONS.md`.)
9. **Public base URL** (`BASE_URL`, e.g. `https://acme.example.com`) and **frontend base URL** (`FRONTEND_URL`; usually the same as `BASE_URL`).
10. **SEO canonical base URL** (`SEO_CANONICAL_BASE_URL`, defaults to `https://teachback.net` in `general.py` — must be changed).

### Group 3 — Persistence
11. **Database** — PostgreSQL 16 is wired in. Confirm or switch (SQLite is supported as a fallback via `dj-database-url`).
12. **Database name / user / password** — defaults `template_db` / `template_user` / `template_password` (must change).
13. **Redis** — keep Redis 7. Confirm host/port or use the bundled service.

### Group 4 — Auth
14. **Authentication** — keep the cookie-based JWT + email verification flow shipped with the template, or replace with another strategy? (Default: keep.)
15. **Token lifetimes** — current `ACCESS_TOKEN_LIFETIME = 5 minutes`, `REFRESH_TOKEN_LIFETIME = 7 days`. Confirm or adjust.

### Group 5 — Email
16. **SMTP provider** — Gmail (template default), SendGrid, Mailgun, AWS SES, or other. Collect host, port, TLS/SSL, sender email, app password / API key.

### Group 6 — Integrations (optional)
17. **Third-party APIs** — the template ships with `g4f`, `groq`, `nodriver` declared. Keep, remove, or replace with the integrations you need.
18. **API key** for the `X-API-KEY` permission header (`API_KEY`) — generate now or skip.

### Group 7 — Branding & assets
19. **Logos & favicon** — drop into `frontend/public/` (replace `favicon.ico`, `logo192.png`, `logo512.png`) and `frontend/src/components/AuthPageShell.jsx` badge.
20. **Theme colors** — the dark theme in `frontend/src/index.css` and `backend/email_templates/base.html` is shared; confirm or supply new tokens.
21. **Nav copy & page titles** — confirm `HomePage.jsx`, `AuthPageShell.jsx`, and `frontend/index.html` titles.

### Group 8 — Optional template knobs
22. **Patch seed data** — keep `backend/patches/0.0.1.json` as a sample or replace.
23. **Sitemap public paths** — current list is `["/", "/about", "/patches", "/pricing", "/terms", "/privacy"]`. Edit the list in `backend/api/views/general.py::SITEMAP_PUBLIC_PATHS`.
24. **WebSocket routes** — leave the empty `URLRouter([])` in `backend/backend/asgi.py`, or add a routing module now.

> If the human declines to answer a question, use the documented template default and surface it in the final report so they can change it later.

---

## 3. Setup Execution

Perform the following edits in order. After every change, briefly state what was changed and why. **Do not edit files that are not on these lists unless the human explicitly requests it.**

### 3.1 Branding & documentation
- `README.md` (root) — replace template description, "What lives here" wording, quick start commands only if they change for the new project, and the runtime topology list.
- `LICENSE` — update copyright `<YEAR> <HOLDER>`.
- `INSTRUCTIONS.md` — replace generic template copy with project-specific notes; keep the Docker/operations section.
- `CONTRIBUTING.md` — replace generic intro; keep branching/testing/standards sections.
- `CHANGELOG.md` — set the first `[Unreleased]` notes and stamp the initial release date.
- `TODO.md` — keep the checklist but reword where it says "template" so it reads as the new project.
- `backend/README.md` — replace the "What this backend includes" list and `API surface` table where generic; keep the operational commands.
- `frontend/README.md` — replace the "What this app includes" list and route map where generic; keep the Scripts and Styling sections.
- `.website/` — delete or replace if the project is not a portfolio piece; otherwise update `metadata.json` `title`, `shortDescription`, `techStack`, `github`, `liveDemo`, `requirements.dependencies`. (Optional: do not require this step.)
- `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md` — adjust title prefixes if desired; otherwise leave.

### 3.2 Project metadata
- `backend/pyproject.toml` — set `[project] name`, `version`, `description`.
- `frontend/package.json` — set `name`, `version`, `description`, `keywords`, `author` (if needed).
- `frontend/index.html` — replace the `<title>FullStack Template</title>` and any meta description.

### 3.3 Environment files
Create untracked env files by copying the examples. Never commit them.

- `cp backend/.env.example backend/.env` and edit:
  - `APP_NAME=<Project name>`
  - `DEBUG=False` for production, `True` for local
  - `SECRET_KEY=<new long random string — use a generator>`
  - `ALLOWED_HOSTS=<comma-separated domains>`
  - `BASE_URL=https://<domain>` (no trailing slash)
  - `FRONTEND_URL=https://<domain>`
  - `DATABASE_URL=postgres://<db_user>:<db_password>@db:5432/<db_name>`
  - `REDIS_URL=redis://redis:6379/1`
  - `CELERY_BROKER_URL=redis://redis:6379/0`
  - `CACHE_PREFIX=<short unique prefix, e.g. project name slug>`
  - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL`, `EMAIL_PASS`
  - `ADMIN_EMAIL=<inbox that receives the contact form>`
  - `ENCRYPTION_KEY=<Fernet key — generate with python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())">`
  - `API_KEY=<long random string>` (or leave blank to disable `APIKeyPermission`)
  - For production, uncomment `SECURE_SSL_REDIRECT=True`, `SESSION_COOKIE_SECURE=True`, `CSRF_COOKIE_SECURE=True`.
  - Optionally uncomment `CORS_ALLOWED_ORIGINS=<frontend origin(s)>`.
- `cp frontend/.env.example frontend/.env` and edit:
  - `VITE_API_URL=https://<domain>/api` (or `http://localhost/api` locally)
  - `VITE_APP_NAME=<Project name>`
  - `VITE_ENV=development` (or `production`)

### 3.4 Django backend tuning
- `backend/backend/settings.py` — leave as-is; values come from env. If the human wants stricter defaults, edit `CORS_ALLOWED_ORIGINS`, `ALLOWED_HOSTS`, and `CACHES["default"]["KEY_PREFIX"]` (all currently env-driven).
- `backend/api/views/general.py` — replace the default `SEO_CANONICAL_BASE_URL = "https://teachback.net"` with the project's canonical URL. Update `SITEMAP_PUBLIC_PATHS` to the project's public routes.
- `backend/email_templates/base.html` and `backend/email_templates/verify_email.html` — update the visible `app_name` references to the new product name.
- `backend/patches/0.0.1.json` — replace title, summary, and `changes` with the new project's initial release notes. Optionally add a new patch file.
- `backend/usermanagement/views.py` — `VERIFICATION_COPY` block contains template-specific copy ("Continue Reset", "Continue Change", etc.). Adjust the user-facing strings if desired.
- `backend/backend/asgi.py` — leave the empty `URLRouter([])` unless the human is adding a websocket route.

### 3.5 Frontend tuning
- `frontend/src/components/AuthPageShell.jsx` — change the default `badge = 'FullStack Template'` to the new product name (or remove the default and pass it from every page).
- `frontend/src/pages/HomePage.jsx` — replace the "FullStack Template" link text and `highlights` / `routes` arrays to reflect the new product.
- `frontend/public/` — replace `favicon.ico`, `logo192.png`, `logo512.png`. Update `public/manifest.json` `name` and `short_name`. Replace `public/index.html` with a stub or remove it (it is leftover Create-React-App output).
- `frontend/src/contexts/AuthContext.jsx`, `MessageContext.jsx` — leave the implementation, only adjust user-facing strings if requested.

### 3.6 Docker & infrastructure
- `docker-compose.yml` — update container names (`template_postgres`, `template_backend`, `template_celery`, `template_celery_beat`, `template_frontend`) and `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` to match the env values. Optionally rename volume names (`postgres_data`, `frontend_node_modules`).
- `nginx/nginx.conf` — set `server_name` to the chosen domain. Adjust the upstream `proxy_pass` hosts only if service names change.
- `certs/` — drop TLS cert and key files here if running HTTPS locally; do not commit them.
- `backend/Dockerfile`, `frontend/Dockerfile` — do not modify.

### 3.7 Permissions & security
- `backend/backend/settings.py` — confirm `DEBUG` is `False`, `SECURE_SSL_REDIRECT` is `True`, and cookie secure flags are enabled in production.
- `backend/utils/permissions.py` — leave; `IsStaff`, `IsAdmin`, `APIKeyPermission` are reusable.

### 3.8 Dependencies
- `backend/requirements.txt` and `backend/pyproject.toml` — if the user removed any of `g4f`, `groq`, `nodriver`, remove them here too. If new dependencies are required, add them to both files and regenerate `uv.lock`.
- `frontend/package.json` — add/remove runtime dependencies. Run `npm install` after editing.

### 3.9 Database bootstrap
- `docker compose up -d`
- `docker compose exec backend python manage.py migrate`
- `docker compose exec backend python manage.py sync_patches`
- `docker compose exec backend python manage.py createsuperuser`

### 3.10 Tests & lint
- `docker compose exec backend python manage.py test`
- `docker compose exec frontend npm run lint`
- `docker compose exec frontend npm run build`

---

## 4. Modification Rules

The AI agent MUST obey these rules at all times:

1. **No silent assumptions.** If a required value is missing, ask. Do not invent names, domains, or secrets.
2. **No unrelated edits.** Do not refactor code, reformat files, rename apps, or change the auth model unless the human explicitly asks.
3. **Preserve code style.** Match the surrounding style (Python: PEP 8 + the file's existing conventions; React: ESLint flat config in `frontend/eslint.config.js`).
4. **Preserve the logging standard.** Per `.github/instructions/LOGGING_STANDARDS.instruction.md`, every backend function and view should already be logging; do not delete log statements.
5. **Preserve the email template standard.** Per `.github/instructions/adding_email_templates.instructions.md`, add new CSS classes only inside `<style>` in `base.html`; do not duplicate styles.
6. **Do not edit `*.Dockerfile` or `.dockerignore`** unless the human requests it.
7. **Do not edit the runtime code** in `backend/api/`, `backend/usermanagement/`, `backend/utils/`, `backend/backend/celery.py`, `backend/backend/asgi.py`, `backend/backend/wsgi.py`, or `frontend/src/utils/api.js`, `frontend/src/utils/auth.js` — these are part of the contract.
8. **Never commit secrets** to `.env.example` or any tracked file. Real secrets go only into untracked `.env` files.
9. **Explain every change** in a one-line note after each edit.
10. **Surface the final summary** as a single bulleted list at the end, including every file touched and every env var set.

---

## 5. Completion Verification

Before reporting `Done`, walk this checklist and confirm each item. If any item fails, fix it before finishing or call it out explicitly in the report.

### 5.1 Configuration
- [ ] `APP_NAME` reflects the project name everywhere it appears (`backend/.env`, `frontend/.env`, `README.md`, LICENSE, page title, email footer).
- [ ] `SECRET_KEY` is a freshly generated long random string, not the template default.
- [ ] `DEBUG` is `False` in the production `.env` and `True` in the local `.env`.
- [ ] `ALLOWED_HOSTS` lists every public domain.
- [ ] `BASE_URL` and `FRONTEND_URL` point to the deployed origin.
- [ ] `SEO_CANONICAL_BASE_URL` no longer reads `https://teachback.net`.

### 5.2 Environment variables
- [ ] `backend/.env` exists, has all required keys, and is not committed.
- [ ] `frontend/.env` exists, has all `VITE_*` keys, and is not committed.
- [ ] SMTP credentials, `ADMIN_EMAIL`, and `ENCRYPTION_KEY` are set.
- [ ] `DATABASE_URL`, `REDIS_URL`, `CELERY_BROKER_URL` match the docker-compose service hosts (`db`, `redis`).
- [ ] `CACHE_PREFIX` is project-specific (not `app`).
- [ ] `API_KEY` is set (or `APIKeyPermission` is not used).

### 5.3 Placeholders
- [ ] No occurrence of `FullStack Template` in the user-visible surface (page title, nav, footer, README, LICENSE).
- [ ] No occurrence of `YourAppName`, `Template` (as APP_NAME default), or `FedxD` in tracked files unless intentional.
- [ ] No occurrence of `template_user`, `template_password`, `template_db` in `docker-compose.yml`, `backend/.env`, or `backend/.env.example`.
- [ ] Container and volume names in `docker-compose.yml` use the new project name.
- [ ] Stale CRA assets in `frontend/public/` are replaced or removed.
- [ ] `package.json` `name`, `pyproject.toml` `[project] name`, and `LICENSE` are consistent.

### 5.4 Dependencies
- [ ] `uv pip install -r backend/requirements.txt` succeeds (or `uv sync`).
- [ ] `npm install` in `frontend/` succeeds.
- [ ] Optional LLM/browser packages (`g4f`, `groq`, `nodriver`) are kept, removed, or replaced per the human's choice.

### 5.5 Build & runtime
- [ ] `docker compose up -d` brings every service up healthy.
- [ ] `docker compose exec backend python manage.py check` passes.
- [ ] `docker compose exec backend python manage.py migrate` applies all migrations.
- [ ] `docker compose exec backend python manage.py sync_patches` creates the seed patch.
- [ ] `docker compose exec backend python manage.py createsuperuser` works.
- [ ] Backend health: `curl -sf http://localhost:8000/admin/` returns 200/302.
- [ ] Frontend health: `curl -sf http://localhost/` (nginx) returns HTML and `http://localhost:5173/` (dev) returns HTML.
- [ ] Nginx routes: `/api/is_admin/`, `/sitemap.xml`, `/robots.txt` reach Django.

### 5.6 Tests & quality
- [ ] `docker compose exec backend python manage.py test` passes.
- [ ] `docker compose exec frontend npm run lint` passes.
- [ ] `docker compose exec frontend npm run build` produces a clean production bundle.

### 5.7 Deployment
- [ ] HTTPS is configured (cert in `certs/` or managed at the platform).
- [ ] `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` are `True` in production env.
- [ ] `CORS_ALLOWED_ORIGINS` matches the deployed frontend origin.
- [ ] Database backup strategy is documented (see `INSTRUCTIONS.md`).
- [ ] Monitoring plan exists (Sentry or equivalent) if required.

### 5.8 Documentation
- [ ] Root `README.md` describes the product, not the template.
- [ ] `INSTRUCTIONS.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `TODO.md` are project-specific.
- [ ] `backend/README.md` and `frontend/README.md` reflect current features.
- [ ] `.github/ISSUE_TEMPLATE/` titles match the new product (optional).
- [ ] `LICENSE` copyright `<YEAR> <HOLDER>` is correct.
- [ ] `.github/setup.md` (this file) is left in place as a reference for future agents — update it if a new question or placeholder is discovered.

---

## 6. Final Report Template

End every setup run with a report in this exact shape so the human can review:

```
## Setup Report — <Project Name>

### Files changed
- <path>: <one-line summary>
- ...

### Environment variables set
- <VAR>: <value summary, not the secret itself>
- ...

### Placeholders replaced
- <old> → <new> in <path>
- ...

### Verification
- [ ] all 5.x checklist items

### Open items (optional)
- <anything the human should revisit, e.g. "replace the favicon in frontend/public/">
```

If any checklist item could not be satisfied, list it under **Open items** instead of marking it done.
