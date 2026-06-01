from typing import Any

from django.contrib.auth.password_validation import validate_password as django_validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.fields import empty
from rest_framework.serializers import CharField, EmailField, ModelSerializer, Serializer, ValidationError

from .models import AuthAcc, AuthAccManager


def validate_password_strength(password: str) -> str:
    try:
        django_validate_password(password)
    except DjangoValidationError as exc:
        raise ValidationError({"password": list(exc.messages)})
    return password


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


class AuthProfileSerializer(ModelSerializer):
    class Meta:
        model = AuthAcc
        fields = (
            "id",
            "email",
            "username",
            "verified",
            "is_staff",
            "is_superuser",
            "last_login",
        )
        read_only_fields = fields


class ProfileUpdateSerializer(ModelSerializer):
    class Meta:
        model = AuthAcc
        fields = (
            "username",
        )

    def validate_username(self, value: str) -> str:
        manager = AuthAccManager()
        manager.validate_username(value)
        return value

    def validate(self, attrs):
        if not attrs.get("username"):
            raise ValidationError({"detail": "Username is required."})
        return attrs


class VerificationRequestSerializer(Serializer):
    email = EmailField()


class PasswordResetRequestSerializer(Serializer):
    email = EmailField()


class PasswordResetConfirmSerializer(Serializer):
    email = EmailField()
    code = CharField(min_length=6, max_length=32)
    new_password = CharField(write_only=True, min_length=8)
    confirm_password = CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise ValidationError({"confirm_password": "Passwords do not match."})
        validate_password_strength(attrs["new_password"])
        return attrs


class PasswordChangeRequestSerializer(Serializer):
    current_password = CharField(write_only=True, min_length=1, trim_whitespace=False)


class PasswordChangeConfirmSerializer(Serializer):
    code = CharField(min_length=6, max_length=32)
    new_password = CharField(write_only=True, min_length=8)
    confirm_password = CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise ValidationError({"confirm_password": "Passwords do not match."})
        validate_password_strength(attrs["new_password"])
        return attrs


class DeleteAccountSerializer(Serializer):
    code = CharField(min_length=6, max_length=32)
