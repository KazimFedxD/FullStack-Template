"""
Centralized error handling utilities for consistent error responses.
Generic implementation for all websites.
"""
from __future__ import annotations

from typing import Any, Dict, Optional
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError, DatabaseError
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
import logging

logger = logging.getLogger('utils')


class ErrorType:
    """Error type constants"""
    VALIDATION_ERROR = "validation_error"
    NOT_FOUND = "not_found"
    PERMISSION_DENIED = "permission_denied"
    AUTHENTICATION_ERROR = "authentication_error"
    DATABASE_ERROR = "database_error"
    INTEGRITY_ERROR = "integrity_error"
    SERVER_ERROR = "server_error"
    BAD_REQUEST = "bad_request"
    EXTERNAL_API_ERROR = "external_api_error"
    CONFLICT = "conflict"


def error_response(
    error_type: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    log_error: bool = True
) -> Response:
    """
    Create a standardized error response.
    
    Args:
        error_type: Type of error (use ErrorType constants)
        message: Human-readable error message
        details: Additional error details/context
        status_code: HTTP status code
        log_error: Whether to log the error
    
    Returns:
        Response object with error details
    """
    error_data = {
        "success": False,
        "error": {
            "type": error_type,
            "message": message,
        }
    }
    
    if details:
        error_data["error"]["details"] = details
    
    if log_error:
        log_message = f"{error_type}: {message}"
        if details:
            log_message += f" | Details: {details}"
        
        if status_code >= 500:
            logger.error(log_message)
        elif status_code >= 400:
            logger.warning(log_message)
        else:
            logger.info(log_message)
    
    return Response(error_data, status=status_code)


def success_response(
    message: str,
    data: Optional[Any] = None,
    status_code: int = status.HTTP_200_OK
) -> Response:
    """
    Create a standardized success response.
    
    Args:
        message: Success message
        data: Response data
        status_code: HTTP status code
    
    Returns:
        Response object with success data
    """
    response_data = {
        "success": True,
        "message": message,
    }
    
    if data is not None:
        response_data["data"] = data
    
    return Response(response_data, status=status_code)


def handle_exception(
    exception: Exception,
    context: str = "Operation",
    user_message: Optional[str] = None
) -> Response:
    """
    Handle common exceptions and return appropriate error response.
    
    Args:
        exception: The exception that occurred
        context: Context description for logging
        user_message: Custom user-facing message (optional)
    
    Returns:
        Response object with error details
    """
    logger.error(f"{context} failed: {type(exception).__name__}: {str(exception)}")
    
    # Database integrity errors (unique constraint, foreign key, etc.)
    if isinstance(exception, IntegrityError):
        error_msg = user_message or "A database constraint was violated. This item may already exist."
        details = {"db_error": str(exception)}
        
        # Check for specific integrity errors
        if "unique constraint" in str(exception).lower():
            error_msg = user_message or "An item with this value already exists."
            details["constraint"] = "unique"
        elif "foreign key" in str(exception).lower():
            error_msg = user_message or "Referenced item does not exist."
            details["constraint"] = "foreign_key"
        elif "not null" in str(exception).lower():
            error_msg = user_message or "Required field is missing."
            details["constraint"] = "not_null"
        
        return error_response(
            ErrorType.INTEGRITY_ERROR,
            error_msg,
            details=details,
            status_code=status.HTTP_409_CONFLICT
        )
    
    # General database errors
    if isinstance(exception, DatabaseError):
        return error_response(
            ErrorType.DATABASE_ERROR,
            user_message or "A database error occurred. Please try again.",
            details={"db_error": str(exception)},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Django validation errors
    if isinstance(exception, DjangoValidationError):
        return error_response(
            ErrorType.VALIDATION_ERROR,
            user_message or "Validation error occurred.",
            details={"validation_errors": exception.message_dict if hasattr(exception, 'message_dict') else str(exception)},
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # DRF validation errors
    if isinstance(exception, DRFValidationError):
        return error_response(
            ErrorType.VALIDATION_ERROR,
            user_message or "Invalid data provided.",
            details={"validation_errors": exception.detail},
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Value errors (often from business logic)
    if isinstance(exception, ValueError):
        return error_response(
            ErrorType.BAD_REQUEST,
            user_message or str(exception),
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Permission errors
    if isinstance(exception, PermissionError):
        return error_response(
            ErrorType.PERMISSION_DENIED,
            user_message or "You don't have permission to perform this action.",
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    # Generic exception - server error
    return error_response(
        ErrorType.SERVER_ERROR,
        user_message or "An unexpected error occurred. Please try again later.",
        details={"error": str(exception), "type": type(exception).__name__},
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def parse_serializer_errors(serializer_errors: dict) -> str:
    """
    Parse DRF serializer errors into a readable message.
    
    Args:
        serializer_errors: Serializer error dict
    
    Returns:
        Human-readable error message
    """
    messages = []
    
    for field, errors in serializer_errors.items():
        if isinstance(errors, list):
            for error in errors:
                if field == 'non_field_errors':
                    messages.append(str(error))
                else:
                    messages.append(f"{field}: {error}")
        else:
            messages.append(f"{field}: {errors}")
    
    return "; ".join(messages) if messages else "Validation failed"


def ratelimit_exception_handler(exc, context):
    """
    Custom exception handler for django-ratelimit.
    Catches Ratelimited exceptions and returns proper 429 response.
    """
    from django_ratelimit.exceptions import Ratelimited
    from rest_framework.views import exception_handler
    
    # Call DRF's default exception handler first
    response = exception_handler(exc, context)
    
    # Check if this is a rate limit exception
    if isinstance(exc, Ratelimited):
        logger.warning(f"Rate limit exceeded for IP: {context['request'].META.get('REMOTE_ADDR')} on {context['request'].path}")
        
        return error_response(
            ErrorType.BAD_REQUEST,
            "Too many requests. Please slow down and try again later.",
            details={
                "rate_limit_exceeded": True,
                "retry_after": "Please wait a few moments before trying again."
            },
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            log_error=False  # Already logged above
        )
    
    return response


def ratelimit_error_response(request, exception=None):
    """
    Custom response for rate limit exceeded errors.
    Called by django-ratelimit when rate limit is exceeded.
    
    Args:
        request: Django request object
        exception: Optional exception object
    
    Returns:
        Response object with rate limit error
    """
    logger.warning(f"Rate limit exceeded for IP: {request.META.get('REMOTE_ADDR')} on {request.path}")
    
    return error_response(
        ErrorType.BAD_REQUEST,
        "Too many requests. Please slow down and try again later.",
        details={
            "rate_limit_exceeded": True,
            "retry_after": "Please wait a few moments before trying again."
        },
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        log_error=False  # Already logged above
    )
