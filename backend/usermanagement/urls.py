from django.urls import path
from .views import *

urlpatterns = [
    path("register/", register, name="register"),
    path("login/", login, name="login"),
    path("logout/", logout, name="logout"),
    path("verify/", verify, name="verify"),
    path("verify/resend/", resend_verification, name="resend_verification"),
    path("password/reset/request/", request_password_reset, name="request_password_reset"),
    path("password/reset/confirm/", reset_password, name="reset_password"),
    path("password/change/request/", request_password_change, name="request_password_change"),
    path("password/change/confirm/", change_password, name="change_password"),
    path("user/profile/", user_profile, name="user_profile"),
    path("user/profile/delete/request/", request_account_delete, name="request_account_delete"),
    path("token/refresh/", get_access_token, name="token_refresh"),
    path("user/authenticated/", is_authenticated, name="user_authenticated"),
]
