from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthenticationMiddleware(MiddlewareMixin):
    """
    Middleware to authenticate users using JWT tokens from cookies.
    This allows DRF to work with httpOnly cookies.
    """
    
    def process_request(self, request):
        # Get the access token from cookies
        access_token = request.COOKIES.get('access_token')
        
        if access_token:
            # Create a fake Authorization header for DRF JWT authentication
            request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
        
        return None


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads tokens from cookies.
    """
    
    def get_header(self, request):
        """
        Extracts the header containing the JSON web token from the given request.
        First checks for token in cookies, then falls back to Authorization header.
        """
        # Try to get from cookies first
        access_token = request.COOKIES.get('access_token')
        
        if access_token:
            # Return the token as if it came from Authorization header
            return f'Bearer {access_token}'.encode('utf-8')
        
        # Fall back to standard authentication (Authorization header)
        return super().get_header(request)
