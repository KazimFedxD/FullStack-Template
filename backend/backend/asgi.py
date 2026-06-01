import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

from stream.routing import websocket_urlpatterns
from stream.middleware import CookieJWTAuthMiddleware

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": CookieJWTAuthMiddleware(URLRouter(websocket_urlpatterns)),
    }
)
