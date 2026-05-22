# Full-Stack Template

A modern, production-ready full-stack web application template featuring:

- **Frontend**: React 19 with Vite, Tailwind CSS 4, Framer Motion, and modern authentication
- **Backend**: Django 5.2 with Django REST Framework, JWT authentication, and Celery
- **Database**: PostgreSQL 16 with flexible configuration
- **Cache/Queue**: Redis 7 for Celery task queue and caching
- **Proxy**: Nginx for reverse proxy and static file serving
- **Containerization**: Docker Compose for easy development and deployment

## ✨ Features

### Frontend
- ⚡ **Vite** - Lightning-fast HMR and build times
- 🎨 **Tailwind CSS 4** - Utility-first CSS framework
- 🎭 **Framer Motion** - Production-ready animations
- 🔐 **JWT Authentication** - Cookie-based auth with auto-refresh
- 📦 **API Client** - Centralized API handling with retry logic
- 🎯 **Error Handling** - Comprehensive error management
- 💾 **State Preservation** - Form/scroll state across reloads
- ⚡ **Browser Caching** - TTL-based caching system
- 🪝 **Custom Hooks** - useAlert, useErrorHandler

### Backend
- 🔐 **JWT Cookie Auth** - Secure httpOnly cookie authentication
- 📧 **Email Templates** - Beautiful responsive email templates
- 📝 **Logging System** - Multi-file rotating logs with JSON formatting
- 🛡️ **Rate Limiting** - Configurable rate limits per endpoint
- ⚡ **Custom Cache System** - Dict-like cache interface
- 🔒 **Encryption Utilities** - Fernet encryption/decryption
- 🎯 **Error Handlers** - Centralized error response system
- 🔑 **API Key Permissions** - Environment-based API authentication
- 📊 **Request Logging Middleware** - Automatic API request logging
- 🔄 **Celery Tasks** - Background job processing with Beat scheduler

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Git
- (Optional) Node.js 18+ and Python 3.11+ for local development

### 1. Fork and Clone

**⭐ Please fork this repository to support the project!**

1. **Fork the repository** on GitHub (click the "Fork" button)
2. **Clone your fork**:
```bash
git clone https://github.com/YOUR-USERNAME/FullStack-Template.git
cd "FullStack Template"
```

3. **Add upstream remote** (to get updates):
```bash
git remote add upstream https://github.com/ORIGINAL-OWNER/FullStack-Template.git
```

### 2. Environment Configuration

Create environment files:

**Backend (.env in /backend/)**
```env
# Application Settings
APP_NAME=YourAppName
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Base URL (without trailing slash)
BASE_URL=http://localhost

# Database
DATABASE_URL=postgres://template_user:template_password@db:5432/template_db

# FullStack Template

A production-oriented, reusable full-stack repository template for modern web applications.

> Note: This README documents the template itself. When you create a new project from it, replace this README and customize TODO.md, CHANGELOG.md, CONTRIBUTING.md, and the issue/PR templates.

## What this template provides

- Independent frontend and backend services designed to scale separately
- React 19 + Vite frontend with Tailwind CSS and Framer Motion
- Django 5.2 + Django REST Framework backend with JWT cookie auth foundations
- Background job support with Celery and Redis
- PostgreSQL as the primary relational datastore
- Nginx reverse proxy for / and /api routing
- Docker Compose workflow for development and local staging
- WebSocket-ready infrastructure for realtime apps
- Production-friendly logging, rate limiting, and caching hooks

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, Vite 7, Tailwind CSS 4, Framer Motion, React Router |
| Backend | Django 5.2, Django REST Framework, SimpleJWT |
| Realtime | ASGI server (Daphne); optional Django Channels wiring |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7, Celery, django-celery-beat |
| Edge/Proxy | Nginx |
| Infra | Docker Compose |

## Architecture

### Frontend architecture

- Vite-powered React app in frontend/
- Modular UI in src/components and route screens in src/pages
- Config-first app settings in src/config
- API access centralized in src/utils with cookie-based auth patterns

### Backend architecture

- Django project in backend/backend and app modules under backend/
- REST APIs defined in api/ and auth flows in usermanagement/
- Centralized logging, error handling, and rate limiting
- Celery worker and beat scheduler in Docker Compose

### Realtime/WebSocket support

This template is WS-ready:

- ASGI server is used in the backend container (Daphne)
- A base WebSocket consumer exists in backend/utils/consumer.py

To fully enable WebSockets for your project:

1. Add Django Channels to backend dependencies
2. Add channels to INSTALLED_APPS
3. Define ASGI routing with ProtocolTypeRouter and URLRouter
4. Add websocket URL routes and your custom consumers

## Environment configuration

Per-service examples are included:

- backend/.env.example
- frontend/.env.example

Create local env files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Key backend variables: SECRET_KEY, DATABASE_URL, REDIS_URL, CELERY_BROKER_URL, EMAIL_*.

Key frontend variables: VITE_API_URL, VITE_APP_NAME, VITE_ENV.

## Setup

### Docker Compose (recommended)

```bash
docker compose up -d
```

### First-time tasks

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

## Development workflow

- Start services: docker compose up -d
- Logs: docker compose logs -f backend | frontend | celery | redis
- Backend tests: docker compose exec backend python manage.py test
- Frontend lint: docker compose exec frontend npm run lint
- Frontend build: docker compose exec frontend npm run build

## Template usage (create a new project)

1. Use "Use this template" on GitHub to create a new repository
2. Update APP_NAME, VITE_APP_NAME, and branding in frontend config
3. Replace .env values and secrets for your environment
4. Review TODO.md, CHANGELOG.md, and CONTRIBUTING.md for your project
5. Update allowed hosts and CORS for your domains
6. Add CI, monitoring, and deployment settings

## Scalable project structure

```
FullStack Template/
  backend/                 # Django backend
    backend/               # Django settings, ASGI/WSGI
    api/                   # API endpoints
    usermanagement/        # Auth flows and middleware
    utils/                 # Shared backend utilities
  frontend/                # React frontend
    src/
      components/          # Reusable UI
      pages/               # Route screens
      contexts/            # Auth and app contexts
      utils/               # API client and helpers
      config/              # App configuration
  nginx/                   # Reverse proxy configuration
  docker-compose.yml       # Service definitions
  README.md                # Template documentation
```

## Semantic versioning strategy

- Template releases follow SemVer: MAJOR.MINOR.PATCH
- For child projects, start at 0.1.0 and increment:
  - MAJOR for breaking API or data changes
  - MINOR for backward-compatible features
  - PATCH for fixes and internal improvements

## Roadmap overview

- Add a production compose file or deployment manifests
- Publish OpenAPI schema and API documentation
- Harden production settings and security checks
- Improve test coverage and add CI pipelines

## Future considerations

- Add full Django Channels wiring for realtime workloads
- Add structured log shipping and distributed tracing
- Add feature flags and staged rollout controls
- Add background task observability (Flower or custom dashboards)

## License

MIT. See LICENSE.
- ⭐ Star the repository if you find it useful!

### Getting Updates:
If you forked the repository, you can get the latest updates:
```bash
git fetch upstream
git merge upstream/main
```

## � Attribution

If you use this template in your project, we'd appreciate:

- ⭐ **Star this repository**
- 🍴 **Fork instead of copying** (helps us see the community impact)
- 📢 **Mention in your README**: 
  ```markdown
  Built with [Full-Stack Template](https://github.com/YOUR-USERNAME/FullStack-Template)
  ```
- 🐦 **Share on social media** with a link back to this repo

While not required by the license, attribution helps us understand the template's impact and motivates continued development!

## �📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

**Note**: While the MIT license doesn't require attribution, we'd greatly appreciate it if you credit this template when using it in your projects. It helps us build a community and continue improving the template for everyone!

## 🆘 Support

- Create issues for bugs or feature requests
- Check existing documentation
- Review Docker logs for debugging

---

## Next Steps

After setup, consider:

1. **Customize branding and styling**
2. **Add your specific business logic**
3. **Implement additional authentication methods**
4. **Add monitoring and analytics**
5. **Setup CI/CD pipeline**
6. **Configure backup strategies**
7. **Add comprehensive testing**

Happy coding! 🚀
