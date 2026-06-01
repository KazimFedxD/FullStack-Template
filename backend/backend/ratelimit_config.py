"""
Rate limiting configuration for the application.
Centralizes all rate limit settings for easy management.
"""

# Centralized rate limiting settings
# Format: 'number/period' where period can be s(econd), m(inute), h(our), d(ay)
RATE_LIMITS = {
    # Authentication endpoints (strictest)
    'auth': {
        'login': '5/m',           # 5 login attempts per minute
        'register': '3/h',        # 3 registrations per hour
        'verify_email': '10/h',   # 10 email verifications per hour
        'resend_verification': '3/h',  # 3 resend verification per hour
        'request_password_reset': '5/h',
        'reset_password': '5/h',
        'request_password_change': '5/h',
        'change_password': '5/h',
        'logout': '10/m',         # 10 logouts per minute
        'refresh_token': '20/m',  # 20 token refreshes per minute
    },
    
    # User profile operations
    'profile': {
        'view': '60/m',           # 60 profile views per minute
        'update': '10/h',         # 10 profile updates per hour
        'delete': '2/d',          # 2 account deletions per day
    },
    
    # Contact/General API
    'api': {
        'contact': '5/h',         # 5 contact form submissions per hour
        'general': '100/m',       # 100 general API requests per minute
    },
    
    # Add your custom rate limits here
    # Example:
    # 'custom_endpoint': {
    #     'create': '10/h',
    #     'list': '60/m',
    # },
}

# Rate limit exceeded response
RATELIMIT_VIEW = 'utils.error_handler.ratelimit_error_response'
