# Full-Stack Template

A modern, production-ready full-stack web application template featuring:

- **Frontend**: React 19 with Tailwind CSS, Framer Motion, and modern authentication
- **Backend**: Django 5.2 with Django REST Framework, JWT authentication, and Celery
- **Database**: PostgreSQL with flexible configuration
- **Cache/Queue**: Redis for Celery task queue and caching
- **Proxy**: Nginx for reverse proxy and static file serving
- **Containerization**: Docker Compose for easy development and deployment

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Git
- (Optional) Node.js 18+ and Python 3.11+ for local development

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd "FullStack Template"
```

### 2. Environment Configuration

Create environment files:

**Backend (.env in /backend/)**
```env
# Database
DATABASE_URL=postgres://template_user:template_password@db:5432/template_db

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Email Configuration
EMAIL=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465

# Celery
CELERY_BROKER_URL=redis://redis:6379/0

# Encryption (auto-generated if not provided)
# ENCRYPTION_KEY=your-encryption-key
```

**Frontend (.env in /frontend/)**
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_APP_NAME=Your App Name
```

### 3. Docker Deployment

**Development (with hot reload):**
```bash
docker-compose up -d
```

**Production:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Initialize Database

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser (optional)
docker-compose exec backend python manage.py createsuperuser
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **Nginx (Production)**: http://localhost

## 📁 Project Structure

```
FullStack Template/
├── backend/                 # Django backend
│   ├── backend/            # Django project settings
│   ├── api/                # Main API app
│   ├── usermanagement/     # Authentication system
│   ├── email_templates/    # Email templates
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile         # Backend container
│   └── manage.py          # Django management script
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts (Auth, etc.)
│   │   ├── utils/         # Utility functions
│   │   └── config/        # App configuration
│   ├── public/            # Static assets
│   ├── package.json       # Node dependencies
│   └── Dockerfile         # Frontend container
├── nginx/                  # Nginx configuration
│   └── nginx.conf         # Reverse proxy config
├── docker-compose.yml      # Docker services definition
└── README.md              # This file
```

## 🛠️ Development Setup

### Local Development (without Docker)

**Backend Setup:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database (PostgreSQL or SQLite)
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

**Frontend Setup:**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

**Start Redis (for Celery):**
```bash
# Using Docker
docker run -d -p 6379:6379 redis:7

# Or install locally and run
redis-server
```

**Start Celery Workers:**
```bash
cd backend

# Start worker
celery -A backend worker --loglevel=info

# Start beat scheduler (in another terminal)
celery -A backend beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

## 🔧 Configuration & Customization

### Backend Configuration

**Key Settings** (`backend/backend/settings.py`):
- `SECRET_KEY`: Change for production
- `DEBUG`: Set to `False` in production
- `ALLOWED_HOSTS`: Add your domain
- `DATABASES`: Configure your database
- `CORS_ALLOW_ALL_ORIGINS`: Restrict in production

**Custom User Model:**
The template includes a custom user model (`usermanagement.AuthAcc`) with email-based authentication.

**API Authentication:**
- JWT tokens with refresh mechanism
- Cookie-based authentication middleware
- Email verification system

### Frontend Configuration

**App Config** (`frontend/src/config/app.js`):
```javascript
export const APP_CONFIG = {
  name: "Your App Name",
  api: {
    baseUrl: process.env.REACT_APP_API_URL || "http://localhost:8000",
    endpoints: {
      login: "/api/auth/login/",
      register: "/api/auth/register/",
      // Add your endpoints here
    }
  },
  // Customize navigation, theme, etc.
};
```

### Adding New Features

**Backend - New API Endpoint:**
1. Create views in `api/views.py`
2. Add URLs in `api/urls.py`
3. Create serializers if needed
4. Add permissions and authentication

**Frontend - New Page:**
1. Create component in `src/pages/`
2. Add route in `src/App.js`
3. Update navigation if needed

## 🐳 Docker Services

### Services Overview

- **db**: PostgreSQL 16 database
- **backend**: Django application server
- **celery**: Celery worker for background tasks
- **celery-beat**: Celery beat scheduler
- **redis**: Redis for caching and message broker
- **frontend**: React development server
- **nginx**: Reverse proxy and static file server

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Execute commands in containers
docker-compose exec backend python manage.py shell
docker-compose exec frontend npm install new-package

# Stop services
docker-compose down

# Rebuild containers
docker-compose build [service-name]

# Remove volumes (⚠️ deletes data)
docker-compose down -v
```

## 🔒 Security Considerations

### Production Security

1. **Environment Variables:**
   - Use strong, unique `SECRET_KEY`
   - Set `DEBUG=False`
   - Configure proper `ALLOWED_HOSTS`
   - Use environment-specific `.env` files

2. **Database Security:**
   - Use strong database passwords
   - Restrict database access
   - Regular backups

3. **HTTPS/SSL:**
   - Configure SSL certificates
   - Update Nginx configuration
   - Force HTTPS redirects

4. **CORS Configuration:**
   - Restrict `CORS_ALLOW_ALL_ORIGINS` to specific domains
   - Configure proper CORS headers

### Authentication Security

- JWT tokens with short expiration
- Refresh token rotation
- Email verification required
- Password strength validation

## 📧 Email Configuration

The template includes an email system for user verification:

1. **Gmail Setup:**
   - Enable 2-factor authentication
   - Generate app-specific password
   - Update `.env` with credentials

2. **Other Email Providers:**
   - Update `EMAIL_HOST` and `EMAIL_PORT`
   - Configure authentication method

## 🧪 Testing

**Backend Tests:**
```bash
docker-compose exec backend python manage.py test
```

**Frontend Tests:**
```bash
docker-compose exec frontend npm test
```

## 📈 Monitoring & Logging

### Celery Monitoring

**Flower (Web UI for Celery):**
```bash
# Add to docker-compose.yml or run separately
celery -A backend flower
```

### Logging

Django logging is configured in `settings.py`. Customize log levels and handlers as needed.

## 🚢 Deployment

### Production Deployment

1. **Environment Setup:**
   - Create production `.env` files
   - Set `DEBUG=False`
   - Configure proper domains
   - Setup SSL certificates

2. **Database Migration:**
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py collectstatic --noinput
   ```

3. **Build Production Images:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
   ```

### Cloud Deployment Options

- **AWS**: ECS, EC2, RDS, ElastiCache
- **Google Cloud**: Cloud Run, Cloud SQL, Cloud Memorystore
- **Digital Ocean**: App Platform, Droplets, Managed Databases
- **Heroku**: Web dynos, Heroku Postgres, Heroku Redis

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection:**
   ```bash
   # Check database status
   docker-compose exec db pg_isready -U template_user
   ```

2. **Frontend Build Issues:**
   ```bash
   # Clear node_modules and reinstall
   docker-compose exec frontend rm -rf node_modules package-lock.json
   docker-compose exec frontend npm install
   ```

3. **Celery Tasks Not Running:**
   ```bash
   # Check Redis connection
   docker-compose exec redis redis-cli ping
   
   # Check Celery workers
   docker-compose logs celery
   ```

4. **Permission Issues:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Debug Mode

Enable debug logging:
```python
# In Django settings
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

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
