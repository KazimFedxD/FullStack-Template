from django.contrib import admin
from django.urls import path, include
from .views import contact

urlpatterns = [
    path("auth/", include("usermanagement.urls")),
    path("contact/", contact, name="contact"),
]
