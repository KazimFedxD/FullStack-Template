from __future__ import annotations

import os
from typing import Any
from rest_framework.request import Request
from rest_framework.permissions import BasePermission


class IsStaff(BasePermission):
    """
    Custom permission to only allow staff members to access certain views.
    """

    def has_permission(self, request: Request, view: Any) -> bool:
        # Check if the user is authenticated and is a staff member
        return request.user.is_authenticated and request.user.is_staff


class IsAdmin(BasePermission):
    """
    Custom permission to only allow admin users to access certain views.
    """

    def has_permission(self, request: Request, view: Any) -> bool:
        # Check if the user is authenticated and is an admin
        return request.user.is_authenticated and request.user.is_superuser


class APIKeyPermission(BasePermission):
    """
    Custom permission to allow access only if a valid API key is provided in the headers.
    Set API_KEY in environment variables to use this permission.
    """

    def has_permission(self, request: Request, view: Any) -> bool:
        api_key = request.headers.get("X-API-KEY")
        valid_api_key = os.getenv("API_KEY") 
        return api_key == valid_api_key if valid_api_key else False
