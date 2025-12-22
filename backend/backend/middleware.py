from __future__ import annotations

from django.utils.deprecation import MiddlewareMixin
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.exceptions import APIException

import logging
import time
import json

logger = logging.getLogger('django.request')


class RequestLoggingMiddleware(MiddlewareMixin):
    """Log all API requests with timing, user info, and response details"""
    
    def process_request(self, request: Request):
        """Mark the start time of the request"""
        request.start_time = time.time()
        return None
    
    def process_response(self, request: Request, response: Response):
        """Log request details after response is generated"""
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            # Build request data
            request_data = {
                'method': request.method,
                'path': request.path,
                'query_params': dict(request.GET),
                'user': str(request.user) if hasattr(request, 'user') and request.user.is_authenticated else 'Anonymous',
                'user_id': request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None,
                'ip': self.get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', '')[:200],
                'status_code': response.status_code,
                'duration_ms': round(duration * 1000, 2),
            }
            
            # Log with appropriate level based on status code
            if response.status_code >= 500:
                logger.error(f"Server Error: {json.dumps(request_data)}")
            elif response.status_code >= 400:
                logger.warning(f"Client Error: {json.dumps(request_data)}")
            else:
                logger.info(f"Request: {json.dumps(request_data)}")
        
        return response
    
    def process_exception(self, request: Request, exception: APIException):
        """Log exceptions that occur during request processing"""
        logger.exception(
            f"Exception in request {request.method} {request.path}: {str(exception)}",
            extra={
                'method': request.method,
                'path': request.path,
                'user': str(request.user) if hasattr(request, 'user') and request.user.is_authenticated else 'Anonymous',
                'ip': self.get_client_ip(request),
            }
        )
        return None
    
    def get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return ip
