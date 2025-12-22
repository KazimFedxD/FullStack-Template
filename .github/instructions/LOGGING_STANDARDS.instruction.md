# Backend Logging Standards

## Overview

This document establishes logging standards for backend applications using this template. **All developers must follow these guidelines when creating or modifying backend code.**

## Core Principle

**Every backend function, view, and critical operation MUST include appropriate logging to enable rapid production debugging and error resolution.**

---

## Logging Configuration

Our backend uses a **Tier 1 Production Logging Setup**:

- **Django Logging Framework**: Multi-file rotating logs with structured JSON formatting
- **Optional**: Sentry SDK for real-time error tracking

### Log Files Structure

All logs are stored in `backend/logs/` (automatically created):

| File | Purpose | Format | Rotation | Level |
|------|---------|--------|----------|-------|
| `django.log` | General application logs | Verbose (human-readable) | 15MB, 10 backups | INFO+ |
| `errors.log` | Error-only logs | JSON (machine-parseable) | 10MB, 10 backups | ERROR |
| `security.log` | Auth/permissions warnings | Verbose | 5MB, 5 backups | WARNING+ |
| `api.log` | API-specific operations | Verbose | 10MB, 10 backups | INFO+ |
| `celery.log` | Background task logs | Verbose | 10MB, 5 backups | INFO+ |
| `database.log` | SQL queries (DEBUG only) | Verbose | 20MB, 3 backups | DEBUG |

### Available Loggers

```python
import logging

logger = logging.getLogger('api')            # For API app
logger = logging.getLogger('usermanagement') # For auth/user operations
logger = logging.getLogger('celery')         # For Celery tasks
# Add your app-specific loggers here
```

---

## When to Log

### ✅ MUST Log

1. **All API endpoints** - Entry, exit, and critical operations
2. **Authentication events** - Login, logout, registration, verification, password changes
3. **Database modifications** - Create, update, delete operations
4. **Payment operations** - All payment-related actions (highly critical)
5. **Error conditions** - Validation failures, exceptions, server errors
6. **Security events** - Unauthorized access attempts, permission denials
7. **External API calls** - Requests to third-party services
8. **Background tasks** - Celery task start, completion, failures

### ⚠️ SHOULD Log

1. **Business logic milestones** - Key decision points in code
2. **Configuration changes** - Dynamic settings updates
3. **Cache operations** - Cache hits, misses, invalidations
4. **File operations** - Uploads, downloads, deletions

### ❌ DO NOT Log

1. **Passwords** - Never log passwords, even hashed
2. **API keys/tokens** - Sensitive credentials
3. **Personal data** - PII unless necessary and sanitized
4. **Large payloads** - Avoid logging massive request/response bodies (summarize instead)

---

## Log Levels Guide

### `logger.debug()`
- **Use for**: Development debugging, verbose details
- **Examples**:
  ```python
  logger.debug(f"Processing {len(items)} items with filters: {filters}")
  logger.debug(f"Query returned {queryset.count()} results")
  ```
- **Note**: Only active when `DEBUG=True`

### `logger.info()`
- **Use for**: Normal operations, successful actions, informational milestones
- **Examples**:
  ```python
  logger.info(f"Fetching all resources")
  logger.info(f"User logged in successfully: {email} (ID: {user.id})")
  logger.info(f"Resource created successfully: {resource.slug} (ID: {resource.id})")
  logger.info(f"Email verified successfully for: {email}")
  ```

### `logger.warning()`
- **Use for**: Recoverable issues, validation failures, authorization denials
- **Examples**:
  ```python
  logger.warning(f"Unauthorized attempt by user: {request.user}")
  logger.warning(f"Login attempt with missing credentials")
  logger.warning(f"Invalid verification token for email: {email}")
  ```

### `logger.error()`
- **Use for**: Serious errors, failed operations, serialization failures
- **Examples**:
  ```python
  logger.error(f"Resource creation failed: {serializer.errors}")
  logger.error(f"Resource {pk} update failed: {serializer.errors}")
  logger.error(f"Logout error for {user_info}: {str(e)}")
  ```

### `logger.exception()`
- **Use for**: Exceptions with full stack traces (use inside `except` blocks)
- **Examples**:
  ```python
  try:
      # risky operation
  except Exception as e:
      logger.exception(f"Unexpected error processing request for user {user.id}")
      raise
  ```

---

## Implementation Patterns

### Pattern 1: API View Logging

**Entry → Operation → Exit**

```python
import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response

logger = logging.getLogger('api')

@api_view(["GET"])
def get_resources(request):
    filters = {"category": request.query_params.get("category")}
    logger.info(f"Fetching resources with filters: {filters}")
    
    try:
        resources = Resource.objects.filter(**filters)
        serializer = ResourceSerializer(resources, many=True)
        
        logger.info(f"Retrieved {len(serializer.data)} resources")
        return Response(serializer.data)
    except Exception as e:
        logger.exception(f"Error fetching resources: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)
```

### Pattern 2: CRUD Operations

**Log resource ID/name and operation result**

```python
def post(self, request: Request) -> Response:
    logger.info(f"Creating new resource: {request.data.get('name', 'N/A')}")
    serializer = ResourceSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        logger.info(f"Resource created successfully: {serializer.data['name']}")
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    logger.error(f"Resource creation failed: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def delete(self, request: Request, pk: int):
    logger.info(f"Deleting resource ID: {pk}")
    resource = get_object_or_404(Resource, pk=pk)
    resource_name = resource.name
    resource.delete()
    logger.info(f"Resource '{resource_name}' (ID: {pk}) deleted successfully")
    return Response(status=status.HTTP_204_NO_CONTENT)
```

### Pattern 3: Authentication Logging

**Always log auth events for security auditing**

```python
def login(request: Request):
    email = request.data.get("email")
    logger.info(f"Login attempt for email: {email}")
    
    if not email or not password:
        logger.warning("Login attempt with missing credentials")
        return Response({"error": "Email and password are required"}, status=400)
    
    try:
        user = authenticate(email=email, password=password)
    except ValueError:
        logger.warning(f"Unverified user login attempt: {email}")
        return Response({"error": "User not verified"}, status=201)
    
    if not user:
        logger.warning(f"Failed login attempt for email: {email} - Invalid credentials")
        return Response({"error": "Invalid credentials"}, status=400)
    
    logger.info(f"User logged in successfully: {email} (ID: {user.id})")
    return response
```

### Pattern 4: Background Tasks (Celery)

**Log task lifecycle**

```python
from celery import shared_task
import logging

logger = logging.getLogger('celery')

@shared_task
def process_batch(item_ids):
    logger.info(f"Batch processing task started for {len(item_ids)} items")
    
    try:
        # task logic
        logger.info(f"Batch processing completed: {success_count}/{len(item_ids)} items")
    except Exception as e:
        logger.exception(f"Batch processing task failed: {str(e)}")
        raise
```

---

## Request Logging Middleware

**Automatic logging for all HTTP requests** (already configured in `backend/backend/middleware.py`):

- Logs request method, path, user, IP, status code, duration
- Automatically categorizes log level based on response status:
  - **INFO**: 2xx, 3xx success responses
  - **WARNING**: 4xx client errors
  - **ERROR**: 5xx server errors

**You don't need to manually log basic request info** - the middleware handles this.

---

## Best Practices

### 1. **Be Concise but Informative**
```python
# ❌ Bad
logger.info("Function called")

# ✅ Good
logger.info(f"Fetching resource detail: {slug}")
```

### 2. **Include Identifiers**
```python
# ❌ Bad
logger.info("User updated")

# ✅ Good
logger.info(f"User {email} (ID: {user.id}) updated successfully")
```

### 3. **Log Context for Errors**
```python
# ❌ Bad
logger.error("Update failed")

# ✅ Good
logger.error(f"Resource '{slug}' update failed: {serializer.errors}")
```

### 4. **Don't Over-Log**
```python
# ❌ Bad - Too much noise
for item in items:
    logger.info(f"Processing item {item.id}")

# ✅ Good - Summary logging
logger.info(f"Processing {len(items)} items")
# ... process items
logger.info(f"Processed {success_count}/{len(items)} items successfully")
```

### 5. **Sanitize Sensitive Data**
```python
# ❌ Bad
logger.info(f"User registered: {user.email}, password: {password}")

# ✅ Good
logger.info(f"User registered: {user.email}")
```

---

## Code Review Checklist

Before submitting code, ensure:

- [ ] Every new view/endpoint has logging
- [ ] Entry and exit points are logged
- [ ] Errors are logged with context
- [ ] No sensitive data (passwords, keys) in logs
- [ ] Appropriate log levels used
- [ ] Resource identifiers included (IDs, slugs, emails)
- [ ] Authentication events are logged (if applicable)
- [ ] Exception handling includes `logger.exception()`

---

## Testing Logs Locally

1. **Start Django server**:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Make API requests**

3. **Check log files**:
   ```bash
   tail -f backend/logs/django.log
   tail -f backend/logs/errors.log
   tail -f backend/logs/api.log
   ```

---

## Troubleshooting

### Logs Not Appearing?

1. **Check `logs/` directory exists**:
   ```bash
   mkdir -p backend/logs
   ```

2. **Verify logger name matches app**:
   ```python
   logger = logging.getLogger('api')  # Must match app name
   ```

3. **Check log level in settings**:
   - `INFO` level required for `logger.info()` to show
   - `DEBUG=True` required for `logger.debug()`

4. **Check file permissions**:
   ```bash
   chmod 755 backend/logs
   ```

---

## Summary

**Remember**: Logs are your first line of defense in production. **Make logging a habit, not an afterthought.**

When you create a new backend feature:

1. Import logging: `import logging`
2. Get logger: `logger = logging.getLogger('app_name')`
3. Log entry: `logger.info(f"Starting operation X")`
4. Log exit: `logger.info(f"Completed operation X")`
5. Log errors: `logger.error()` or `logger.exception()`
