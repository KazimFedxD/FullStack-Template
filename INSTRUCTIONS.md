# Setup and Operations (Quick Guide)

This guide is intended to be customized in projects created from the template. For architecture and rationale, see README.md.

## Prerequisites

- Docker and Docker Compose
- Git
- Optional: Node.js 18+ and Python 3.11+ for local development

## Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update the key values in both files, especially SECRET_KEY, DATABASE_URL, and VITE_API_URL.

## Run the stack

```bash
docker compose up -d
```

Access points:

- Frontend (dev): http://localhost:5173
- Frontend (nginx): http://localhost
- Backend API: http://localhost:8000
- Admin: http://localhost:8000/admin

## Common operations

```bash
# Migrations
docker compose exec backend python manage.py migrate

# Create a superuser
docker compose exec backend python manage.py createsuperuser

# Logs
docker compose logs -f backend

# Backend tests
docker compose exec backend python manage.py test

# Frontend lint
docker compose exec frontend npm run lint
```

## Optional local development (without Docker)

```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

```bash
cd frontend
npm install
npm run dev
```
- [ ] Set `SECURE_SSL_REDIRECT=True`
- [ ] Set `SESSION_COOKIE_SECURE=True`
- [ ] Set `CSRF_COOKIE_SECURE=True`
- [ ] Review and update CORS settings
- [ ] Enable rate limiting for all endpoints
- [ ] Set up monitoring and error tracking (Sentry)
- [ ] Configure firewall rules
- [ ] Set up automated backups

### Environment Variables for Production

```env
DEBUG=False
SECRET_KEY=<generate-long-random-string>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
BASE_URL=https://yourdomain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### Database Backup Strategy

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U template_user template_db > "backups/db_${DATE}.sql"
# Keep only last 7 days
find backups/ -name "db_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab (daily backup at 2 AM)
0 2 * * * /path/to/backup.sh
```

---

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Celery Documentation](https://docs.celeryq.dev/)

## Project-Specific Documentation

- See `.github/instructions/LOGGING_STANDARDS.instruction.md` for logging guidelines
- See `.github/instructions/adding_email_templates.instructions.md` for email template creation
- Check `AI/` folder for implementation documentation

---

## Getting Help

1. Check logs: `docker-compose logs -f`
2. Check backend logs: `tail -f backend/logs/django.log`
3. Check this troubleshooting section
4. Review error messages carefully
5. Search for similar issues online
6. Open an issue on GitHub

---

**Happy coding! 🚀**
