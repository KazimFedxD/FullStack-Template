from typing import Any

from rest_framework.fields import empty
from rest_framework.serializers import ModelSerializer, ValidationError

from .models import AuthAcc, AuthAccManager


class AuthAccSerializer(ModelSerializer):
    class Meta:
        model = AuthAcc
        fields = (
            "id",
            "email",
            "username",
            "password",
            "verified",
        )
        extra_kwargs = {
            "password": {"write_only": True},
            "verified": {"default": False, "read_only": True},
            "id": {"read_only": True},
        }

    def create(self, validated_data: dict[str, Any]) -> AuthAcc:
        manager = AuthAccManager()
        try:
            manager.validate_email(validated_data.get("email", empty))
        except ValueError as e:
            # Raise a ValidationError with the error message
            raise ValidationError({"email": str(e)})
        try:
            manager.validate_username(validated_data.get("username", empty))
        except ValueError as e:
            # Raise a ValidationError with the error message
            raise ValidationError({"username": str(e)})
        try:
            # Validate the input using the manager's validation logic
            user = manager.create_user(**validated_data)
        except ValueError as e:
            # Raise a ValidationError with the error message
            raise ValidationError({"detail": str(e)})
        return user
