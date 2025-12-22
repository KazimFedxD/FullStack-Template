"""
Utility module for the backend application.
Provides common utilities including encryption, email, error handling, and permissions.
"""

from .encryption import encrypt, decrypt
from .mail import sendmail, get_template
from .error_handler import (
    error_response,
    success_response,
    handle_exception,
    parse_serializer_errors,
    ratelimit_exception_handler,
    ratelimit_error_response,
    ErrorType
)
from .permissions import IsStaff, IsAdmin, APIKeyPermission

__all__ = [
    # Encryption
    'encrypt',
    'decrypt',
    
    # Mail
    'sendmail',
    'get_template',
    
    # Error handling
    'error_response',
    'success_response',
    'handle_exception',
    'parse_serializer_errors',
    'ratelimit_exception_handler',
    'ratelimit_error_response',
    'ErrorType',
    
    # Permissions
    'IsStaff',
    'IsAdmin',
    'APIKeyPermission',
]
