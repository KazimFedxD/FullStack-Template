from django.urls import path
from .views import *

urlpatterns = [
    path("register/", register, name="register"),
    path("login/", login, name="login"),
    path("logout/", logout, name="logout"),
    path("verify/", verify, name="verify"),
    path("user/profile/", user_profile, name="user_profile"),
    path("token/refresh/", get_access_token, name="token_refresh"),
    path("user/authenticated/", is_authenticated, name="user_authenticated"),
]
