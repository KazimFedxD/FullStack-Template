# FullStack Template - Setup and Development Instructions

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Environment Variables](#environment-variables)
3. [Running the Application](#running-the-application)
4. [Development Workflow](#development-workflow)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### 1. Prerequisites
- Docker and Docker Compose installed
- Git installed
- (Optional) Node.js 18+ for local frontend development
- (Optional) Python 3.11+ for local backend development

### 2. Clone and Configure

```bash
# Clone the repository
git clone <your-repo-url>
cd "FullStack Template"

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Edit Environment Files

**backend/.env:**
```env
APP_NAME=YourAppName                  # Your application name
DEBUG=True                            # Set to False in production
SECRET_KEY=change-this-secret-key     # Generate a secure key
BASE_URL=http://localhost             # Your frontend URL

# Email Configuration (Gmail example)
EMAIL=your-email@gmail.com
EMAIL_PASS=your-app-password          # Use App Password, not your real password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True

# Database (use default for Docker setup)
DATABASE_URL=postgres://template_user:template_password@db:5432/template_db

# Redis & Cache
REDIS_URL=redis://redis:6379/1
CACHE_PREFIX=myapp

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost/api     # API endpoint through nginx
VITE_APP_NAME=YourAppName             # Should match backend APP_NAME
VITE_ENV=development
```

---

## Environment Variables

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_NAME` | Yes | - | Application name used in emails and responses |
| `DEBUG` | No | False | Enable debug mode (development only) |
| `SECRET_KEY` | Yes | - | Django secret key for cryptographic signing |
| `ALLOWED_HOSTS` | No | localhost,127.0.0.1 | Comma-separated list of allowed hosts |
| `BASE_URL` | Yes | - | Frontend URL for email links |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `EMAIL_HOST` | Yes | - | SMTP server hostname |
| `EMAIL_PORT` | Yes | - | SMTP server port |
| `EMAIL_USE_TLS` | No | True | Use TLS for email |
| `EMAIL` | Yes | - | Sender email address |
| `EMAIL_PASS` | Yes | - | Email password or app password |
| `REDIS_URL` | Yes | - | Redis connection string |
| `CACHE_PREFIX` | No | app | Cache key prefix |
| `CELERY_BROKER_URL` | Yes | - | Celery broker URL (Redis) |
| `API_KEY` | No | - | Optional API key for APIKeyPermission |
| `ENCRYPTION_KEY` | No | Auto-generated | Fernet encryption key |

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | - | Backend API URL |
| `VITE_APP_NAME` | Yes | - | Application name (display purposes) |
| `VITE_ENV` | No | development | Environment name |

---

## Running the Application

### Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### First-Time Setup

```bash
# Run database migrations
docker-compose exec backend python manage.py migrate

# Create superuser (optional)
docker-compose exec backend python manage.py createsuperuser

# Collect static files (if needed)
docker-compose exec backend python manage.py collectstatic --noinput
```

### Access Points

- **Frontend (Dev)**: http://localhost:5173
- **Frontend (Nginx)**: http://localhost
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

---

## Development Workflow

### Frontend Development

**Inside Docker:**
```bash
# Frontend hot-reloads automatically
# Just edit files in frontend/src/
```

**Local Development (Optional):**
```bash
cd frontend
npm install
npm run dev
```

### Backend Development

**Inside Docker:**
```bash
# Backend auto-reloads with DEBUG=True
# Edit files in backend/

# Run management commands
docker-compose exec backend python manage.py <command>

# Django shell
docker-compose exec backend python manage.py shell
```

**Local Development (Optional):**
```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

### Database Management

```bash
# Create migration
docker-compose exec backend python manage.py makemigrations

# Apply migrations
docker-compose exec backend python manage.py migrate

# Database shell
docker-compose exec db psql -U template_user -d template_db

# Backup database
docker-compose exec db pg_dump -U template_user template_db > backup.sql

# Restore database
docker-compose exec -T db psql -U template_user -d template_db < backup.sql
```

### Celery Tasks

```bash
# View Celery worker logs
docker-compose logs -f celery

# View Celery Beat logs (scheduler)
docker-compose logs -f celery-beat

# Execute task manually (Django shell)
docker-compose exec backend python manage.py shell
>>> from your_app.tasks import your_task
>>> your_task.delay(args)
```

---

## Common Tasks

### Adding a New Django App

```bash
# Create app
docker-compose exec backend python manage.py startapp app_name

# Register in settings.py
# INSTALLED_APPS = [
#     ...
#     'app_name',
# ]
```

### Adding Frontend Dependencies

```bash
# Install package
docker-compose exec frontend npm install package-name

# Or edit package.json and rebuild
docker-compose up -d --build frontend
```

### Adding Backend Dependencies

```bash
# Add to requirements.txt
echo "package-name==version" >> backend/requirements.txt

# Rebuild
docker-compose up -d --build backend
```

### Running Tests

**Backend:**
```bash
# Run all tests
docker-compose exec backend python manage.py test

# Run specific app tests
docker-compose exec backend python manage.py test app_name

# With coverage
docker-compose exec backend coverage run --source='.' manage.py test
docker-compose exec backend coverage report
```

**Frontend:**
```bash
# Run tests (if configured)
docker-compose exec frontend npm test

# Run lint
docker-compose exec frontend npm run lint
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Application logs (backend only)
tail -f backend/logs/django.log
tail -f backend/logs/errors.log
tail -f backend/logs/api.log
```

---

## Troubleshooting

### Frontend Build Issues

```bash
# Clear node_modules and rebuild
docker-compose down
docker volume rm fullstack_template_frontend_node_modules
docker-compose up -d --build frontend
```

### Backend Issues

```bash
# Clear Python cache
find backend -type d -name __pycache__ -exec rm -r {} +

# Rebuild
docker-compose up -d --build backend
```

### Database Connection Issues

```bash
# Check database status
docker-compose exec db psql -U template_user -d template_db -c "SELECT 1"

# Restart database
docker-compose restart db

# Reset database (WARNING: Deletes all data)
docker-compose down
docker volume rm fullstack_template_postgres_data
docker-compose up -d db
docker-compose exec backend python manage.py migrate
```

### Port Already in Use

```bash
# Find process using port (Linux/Mac)
sudo lsof -i :8000
sudo lsof -i :5173

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Permission Issues (Linux)

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix Docker socket permission
sudo chmod 666 /var/run/docker.sock
```

### Email Not Sending

1. **Gmail Users**: Use App Password, not your account password
   - Go to Google Account → Security → 2-Step Verification → App Passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASS`

2. **Check Settings**:
   ```bash
   docker-compose exec backend python manage.py shell
   >>> from django.core.mail import send_mail
   >>> send_mail('Test', 'Test message', 'from@example.com', ['to@example.com'])
   ```

3. **Check Logs**:
   ```bash
   docker-compose logs backend | grep -i email
   tail -f backend/logs/django.log | grep -i email
   ```

### Celery Not Processing Tasks

```bash
# Check Celery worker is running
docker-compose ps celery

# Check Celery logs
docker-compose logs -f celery

# Check Redis connection
docker-compose exec redis redis-cli ping
# Should return "PONG"

# Restart Celery
docker-compose restart celery celery-beat
```

---

## Production Deployment

### Security Checklist

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Set `DEBUG=False`
- [ ] Update `ALLOWED_HOSTS` with your domain
- [ ] Use strong database password
- [ ] Enable HTTPS/SSL
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
