from __future__ import annotations

from urllib.parse import quote

from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework_simplejwt.tokens import RefreshToken

from .models import AuthAcc, VerificationToken, authenticate
from .serializers import (
    AuthAccSerializer,
    AuthProfileSerializer,
    DeleteAccountSerializer,
    PasswordChangeConfirmSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ProfileUpdateSerializer,
    VerificationRequestSerializer,
)
from .services import issue_verification_token, mask_email, revoke_user_sessions, serialize_user
from utils.error_handler import ErrorType, error_response, handle_exception, success_response
from utils.mail import get_template, sendmail

import logging
import os

logger = logging.getLogger("usermanagement")

APP_NAME = os.getenv("APP_NAME", "Template")
BASE_URL = os.getenv("BASE_URL", "http://localhost").rstrip("/")
FRONTEND_URL = os.getenv("FRONTEND_URL", BASE_URL).rstrip("/")

VERIFICATION_COPY = {
    "email_verification": {
        "title": "Email Verification",
        "button_label": "Verify Email",
        "intro": "Please verify your email address using the code below.",
        "security_note": "This code expires in 10 minutes.",
    },
    "password_reset": {
        "title": "Password Reset Verification",
        "button_label": "Continue Reset",
        "intro": "Use the code below to continue resetting your password.",
        "security_note": "This password reset code expires in 10 minutes.",
    },
    "password_change": {
        "title": "Password Change Verification",
        "button_label": "Continue Change",
        "intro": "Use the code below to confirm your password change.",
        "security_note": "This password change code expires in 10 minutes.",
    },
    "account_delete": {
        "title": "Account Deletion Verification",
        "button_label": "Confirm Deletion",
        "intro": "Use the code below to confirm deletion of your account.",
        "security_note": "This deletion code expires in 10 minutes.",
    },
}


def _build_verification_url(email: str, reason: str, code: str) -> str:
    return (
        f"{FRONTEND_URL}/verify?email={quote(email)}"
        f"&reason={quote(reason)}&code={quote(code)}"
    )


def _send_verification_email(user: AuthAcc, reason: str) -> str:
    details = VERIFICATION_COPY[reason]
    token = issue_verification_token(user, reason)
    verification_url = _build_verification_url(user.email, reason, token)

    mail_template = get_template(
        "verify_email",
        app_name=APP_NAME,
        email=user.email,
        code=token,
        base_url=FRONTEND_URL,
        title=details["title"],
        intro=details["intro"],
        button_label=details["button_label"],
        button_url=verification_url,
        security_note=details["security_note"],
        masked_email=mask_email(user.email),
    )

    sent = sendmail(user.email, f"{APP_NAME} {details['title']}", mail_template)
    if not sent:
        raise ValueError(f"Unable to send {details['title'].lower()} email")

    logger.info(
        "Verification email sent to %s for reason=%s",
        mask_email(user.email),
        reason,
    )
    return token


def _auth_response(user: AuthAcc, message: str, status_code: int = status.HTTP_200_OK):
    return success_response(
        message,
        data=serialize_user(user),
        status_code=status_code,
    )


def _clear_auth_cookies(response):
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("csrftoken", path="/")
    return response


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate=settings.RATE_LIMITS["auth"]["register"], method="POST")
def register(request: Request):
    """Register a new user and send an email verification code."""
    try:
        logger.info("Registration attempt for %s", mask_email(request.data.get("email", "")))

        if request.user.is_authenticated:
            logger.warning(
                "Registration attempt by already authenticated user: %s",
                mask_email(request.user.email),
            )
            return error_response(
                ErrorType.BAD_REQUEST,
                "You are already logged in",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AuthAccSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("Registration validation failed: %s", serializer.errors)
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Registration validation failed",
                details={"validation_errors": serializer.errors},
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.create(serializer.validated_data)
        _send_verification_email(user, "email_verification")

        logger.info("User registered successfully: %s", mask_email(user.email))
        return success_response(
            "Registration successful. Check your email for the verification code.",
            data={
                "user": serialize_user(user),
                "verification_required": True,
            },
            status_code=status.HTTP_201_CREATED,
        )
    except Exception as exc:
        return handle_exception(
            exc,
            "User registration",
            "Failed to register user. Please try again.",
        )


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate=settings.RATE_LIMITS["auth"]["login"], method="POST")
def login(request: Request):
    """Login a user and set cookie-based JWT tokens."""
    try:
        email = request.data.get("email")
        password = request.data.get("password")
        logger.info("Login attempt for %s", mask_email(email or ""))

        if request.user.is_authenticated:
            logger.warning(
                "Login attempt by already authenticated user: %s",
                mask_email(request.user.email),
            )
            return error_response(
                ErrorType.BAD_REQUEST,
                "You are already logged in",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if not email or not password:
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Email and password are required",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = authenticate(email=email, password=password)
        except ValueError:
            user = AuthAcc.objects.filter(email=email).first()
            if not user:
                return error_response(
                    ErrorType.AUTHENTICATION_ERROR,
                    "Invalid credentials",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            _send_verification_email(user, "email_verification")
            return success_response(
                "Your account is not verified yet. We sent a new verification code.",
                data={"verification_required": True, "user": serialize_user(user)},
                status_code=status.HTTP_202_ACCEPTED,
            )

        if not user:
            return error_response(
                ErrorType.AUTHENTICATION_ERROR,
                "Invalid credentials",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user.set_last_login()
        refresh = RefreshToken.for_user(user)
        response = _auth_response(user, "Login successful")
        response.set_cookie(
            "refresh_token",
            str(refresh),
            max_age=60 * 60 * 24 * 7,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
        )
        response.set_cookie(
            "access_token",
            str(refresh.access_token),
            max_age=60 * 5,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
        )

        logger.info("User logged in successfully: %s", mask_email(user.email))
        return response
    except Exception as exc:
        return handle_exception(exc, "User login", "Failed to log in. Please try again.")


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate=settings.RATE_LIMITS["auth"]["resend_verification"], method="POST")
def resend_verification(request: Request):
    """Resend email verification code for an existing unverified account."""
    try:
        serializer = VerificationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Email is required",
                details={"validation_errors": serializer.errors},
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"]
        user = AuthAcc.objects.filter(email=email).first()
        if user and not user.verified:
            _send_verification_email(user, "email_verification")

        return success_response(
            "If an account exists for that email, a verification code has been sent.",
            status_code=status.HTTP_200_OK,
        )
    except Exception as exc:
        return handle_exception(
            exc,
            "Resend verification",
            "Failed to resend the verification code.",
        )


@api_view(["GET"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate=settings.RATE_LIMITS["auth"]["verify_email"], method="GET")
def verify(request: Request):
    """Verify the user's email using the verification token."""
    try:
        email = request.query_params.get("email")
        token = request.query_params.get("code")
        reason = request.query_params.get("reason", "email_verification")

        logger.info("Email verification attempt for %s", mask_email(email or ""))

        if reason not in VERIFICATION_COPY:
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Unsupported verification flow.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if not email or not token:
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Email and verification code are required",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user = AuthAcc.objects.filter(email=email).first()
        if not user:
            return error_response(
                ErrorType.NOT_FOUND,
                "User not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if reason != "email_verification":
            return error_response(
                ErrorType.BAD_REQUEST,
                "Use the password or delete workflow pages for this verification code.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if user.verified:
            return success_response(
                "Your email is already verified.",
                data={"verified": True, "user": serialize_user(user)},
                status_code=status.HTTP_200_OK,
            )

        if not VerificationToken.check(user, token, "email_verification"):
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Invalid or expired verification code",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user.verified = True
        user.save(update_fields=["verified"])
        logger.info("Email verified successfully for %s", mask_email(user.email))
        return success_response(
            "Email verified successfully",
            data={"verified": True, "user": serialize_user(user)},
            status_code=status.HTTP_200_OK,
        )
    except Exception as exc:
        return handle_exception(exc, "Email verification", "Failed to verify email. Please try again.")


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate=settings.RATE_LIMITS["auth"]["request_password_reset"], method="POST")
def request_password_reset(request: Request):
    """Send a password reset verification code to the provided email."""
    try:
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Email is required",
                details={"validation_errors": serializer.errors},
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"]
        user = AuthAcc.objects.filter(email=email).first()
        if user:
            _send_verification_email(user, "password_reset")

        return success_response(
            "If the account exists, we sent a password reset code.",
            status_code=status.HTTP_200_OK,
        )
    except Exception as exc:
        return handle_exception(
            exc,
            "Password reset request",
            "Failed to request a password reset code.",
        )


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate=settings.RATE_LIMITS["auth"]["reset_password"], method="POST")
def reset_password(request: Request):
    """Reset a password using a verification code and a new password."""
    try:
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Password reset validation failed",
                details={"validation_errors": serializer.errors},
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]
        new_password = serializer.validated_data["new_password"]
        user = AuthAcc.objects.filter(email=email).first()
        if not user:
            return error_response(
                ErrorType.NOT_FOUND,
                "User not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if not VerificationToken.check(user, code, "password_reset"):
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Invalid or expired verification code",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        revoked = revoke_user_sessions(user)
        logger.info(
            "Password reset completed for %s and revoked %s sessions",
            mask_email(user.email),
            revoked,
        )
        return success_response(
            "Password reset successfully. Please sign in again.",
            data={"user": serialize_user(user)},
            status_code=status.HTTP_200_OK,
        )
    except Exception as exc:
        return handle_exception(
            exc,
            "Password reset confirmation",
            "Failed to reset the password.",
        )


@csrf_exempt
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=settings.RATE_LIMITS["auth"]["request_password_change"], method="POST")
def request_password_change(request: Request):
    """Send a password change verification code to the authenticated user."""
    try:
        user = request.user
        _send_verification_email(user, "password_change")
        return success_response(
            "We sent a password change code to your email address.",
            status_code=status.HTTP_200_OK,
        )
    except Exception as exc:
        return handle_exception(
            exc,
            "Password change request",
            "Failed to request a password change code.",
        )


@csrf_exempt
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=settings.RATE_LIMITS["auth"]["change_password"], method="POST")
def change_password(request: Request):
    """Change the authenticated user's password after verifying the code."""
    try:
        serializer = PasswordChangeConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Password change validation failed",
                details={"validation_errors": serializer.errors},
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        code = serializer.validated_data["code"]
        new_password = serializer.validated_data["new_password"]

        if not VerificationToken.check(user, code, "password_change"):
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Invalid or expired verification code",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        revoked = revoke_user_sessions(user)
        logger.info(
            "Password changed for %s and revoked %s sessions",
            mask_email(user.email),
            revoked,
        )

        response = success_response(
            "Password changed successfully. Please log in again.",
            data={"user": serialize_user(user)},
            status_code=status.HTTP_200_OK,
        )
        return _clear_auth_cookies(response)
    except Exception as exc:
        return handle_exception(
            exc,
            "Password change",
            "Failed to change the password.",
        )


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=settings.RATE_LIMITS["profile"]["view"], method="GET")
@ratelimit(key="user", rate=settings.RATE_LIMITS["profile"]["update"], method="PATCH")
@ratelimit(key="user", rate=settings.RATE_LIMITS["profile"]["delete"], method="DELETE")
def user_profile(request: Request):
    """Get, update, or delete the authenticated user's profile."""
    try:
        user = request.user

        if request.method == "GET":
            logger.info("Profile request for %s", mask_email(user.email))
            return success_response(
                "Profile retrieved successfully",
                data=serialize_user(user),
                status_code=status.HTTP_200_OK,
            )

        if request.method == "PATCH":
            serializer = ProfileUpdateSerializer(instance=user, data=request.data, partial=True)
            if not serializer.is_valid():
                return error_response(
                    ErrorType.VALIDATION_ERROR,
                    "Profile update validation failed",
                    details={"validation_errors": serializer.errors},
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            new_username = serializer.validated_data.get("username")
            if new_username:
                user.username = new_username
                user.save(update_fields=["username"])

            logger.info("Profile updated for %s", mask_email(user.email))
            return success_response(
                "Profile updated successfully",
                data=serialize_user(user),
                status_code=status.HTTP_200_OK,
            )

        delete_serializer = DeleteAccountSerializer(data=request.data)
        if not delete_serializer.is_valid():
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Account deletion validation failed",
                details={"validation_errors": delete_serializer.errors},
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        code = delete_serializer.validated_data["code"]
        if not VerificationToken.check(user, code, "account_delete"):
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Invalid or expired verification code",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user_email = user.email
        revoked = revoke_user_sessions(user)
        user.delete()
        logger.info("Account deleted for %s after revoking %s sessions", mask_email(user_email), revoked)

        response = success_response(
            "Account deleted successfully.",
            status_code=status.HTTP_200_OK,
        )
        return _clear_auth_cookies(response)
    except Exception as exc:
        return handle_exception(
            exc,
            "User profile",
            "Failed to process the profile request.",
        )


@csrf_exempt
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=settings.RATE_LIMITS["profile"]["delete"], method="POST")
def request_account_delete(request: Request):
    """Send an account deletion verification code to the authenticated user."""
    try:
        _send_verification_email(request.user, "account_delete")
        return success_response(
            "We sent an account deletion code to your email address.",
            status_code=status.HTTP_200_OK,
        )
    except Exception as exc:
        return handle_exception(
            exc,
            "Account delete request",
            "Failed to request account deletion verification.",
        )


@api_view(["POST", "GET"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate=settings.RATE_LIMITS["auth"]["logout"], method=["POST", "GET"])
def logout(request: Request):
    """Logout the user by blacklisting the refresh token and clearing cookies."""
    try:
        user_info = request.user.email if request.user.is_authenticated else "Anonymous"
        logger.info("Logout attempt by %s", mask_email(user_info) if user_info != "Anonymous" else user_info)

        refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh")
        response = success_response("Logged out successfully", status_code=status.HTTP_205_RESET_CONTENT)
        _clear_auth_cookies(response)

        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
                logger.info("User logged out successfully: %s", user_info)
            except Exception:
                logger.info("User logged out with an already invalid refresh token: %s", user_info)
        else:
            logger.info("User logged out without a refresh token: %s", user_info)

        return response
    except Exception as exc:
        logger.error("Logout error for %s: %s", request.user if hasattr(request, "user") else "unknown", str(exc))
        response = success_response("Logged out successfully", status_code=status.HTTP_205_RESET_CONTENT)
        return _clear_auth_cookies(response)


@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate=settings.RATE_LIMITS["auth"]["refresh_token"], method="POST")
def get_access_token(request: Request):
    """Get access token using the refresh token cookie or request body."""
    try:
        from rest_framework_simplejwt.exceptions import TokenError

        logger.info("Access token refresh attempt")
        refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh")

        if not refresh_token:
            return error_response(
                ErrorType.AUTHENTICATION_ERROR,
                "Refresh token is required",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            response = success_response(
                "Access token refreshed successfully",
                data={"access": access_token},
                status_code=status.HTTP_200_OK,
            )
            response.set_cookie(
                "access_token",
                access_token,
                max_age=60 * 5,
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
            )
            return response
        except TokenError as exc:
            return error_response(
                ErrorType.AUTHENTICATION_ERROR,
                "Invalid or expired refresh token. Please log in again.",
                details={"error": str(exc)},
                status_code=status.HTTP_401_UNAUTHORIZED,
            )
    except Exception as exc:
        return handle_exception(
            exc,
            context="token_refresh",
            user_message="Failed to refresh access token. Please log in again.",
        )


@api_view(["POST", "GET"])
@permission_classes([IsAuthenticated])
@ratelimit(key="user_or_ip", rate=settings.RATE_LIMITS["api"]["general"], method=["POST", "GET"])
def is_authenticated(request: Request):
    """Check if the user is authenticated."""
    try:
        return success_response(
            "User is authenticated",
            data=serialize_user(request.user),
            status_code=status.HTTP_200_OK,
        )
    except Exception as exc:
        return handle_exception(
            exc,
            context="authentication_check",
            user_message="Failed to verify authentication status",
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=settings.RATE_LIMITS["api"]["general"], method="GET")
def is_admin(request: Request):
    """Check if the authenticated user has admin privileges."""
    try:
        user = request.user
        is_admin_user = user.is_staff or user.is_superuser
        logger.info("Admin check for %s: %s", mask_email(user.email), is_admin_user)
        return success_response(
            "Admin status retrieved",
            data={"is_admin": is_admin_user},
            status_code=status.HTTP_200_OK,
        )
    except Exception as exc:
        return handle_exception(
            exc,
            context="is_admin_check",
            user_message="Failed to verify admin status. Please try again later.",
        )
