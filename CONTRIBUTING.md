# Contributing

This guide is intended to be customized in projects created from the template.

## Quick start

1. Fork and clone the repository.
2. Create environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Start the stack:

```bash
docker compose up -d
```

## Development workflow

- Backend commands run in the backend container:
  - `docker compose exec backend python manage.py migrate`
  - `docker compose exec backend python manage.py test`
- Frontend commands run in the frontend container:
  - `docker compose exec frontend npm run lint`
  - `docker compose exec frontend npm run build`

## Branching and pull requests

- Use short-lived branches tied to a single feature or fix.
- Keep pull requests focused and explain the problem and the solution.
- Include migration notes if database schema changes.
- Add screenshots for UI changes.

## Code standards

- Keep API responses consistent and validate inputs.
- Reuse existing utilities and avoid duplicating logic.
- Document new environment variables in README.md.

## Testing

- Add tests for new endpoints and critical logic.
- Run backend tests before opening a PR.
- Run frontend lint for UI changes.

## Reporting security issues

Please do not open public issues for security reports. Use a private disclosure channel defined by the maintainers.
