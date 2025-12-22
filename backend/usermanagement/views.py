from __future__ import annotations

from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django_ratelimit.decorators import ratelimit
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.request import Request
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken


from .serializers import AuthAccSerializer
from .models import AuthAcc, AuthAccManager, VerificationToken, authenticate

from utils.mail import sendmail, get_template
from utils.permissions import IsAdmin, IsStaff
from utils.error_handler import error_response, success_response, handle_exception, ErrorType

from dotenv import load_dotenv
import os
import logging

load_dotenv()

logger = logging.getLogger('usermanagement')

APP_NAME = os.getenv("APP_NAME", "Template")
BASE_URL = os.getenv("BASE_URL", "http://localhost")

# Create your views here.


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate=settings.RATE_LIMITS['auth']['register'], method='POST')
def register(request: Request):
    """
    Register a new user.
    """
    try:
        logger.info(f"Registration attempt for email: {request.data.get('email', 'N/A')}")
        if request.user.is_authenticated:
            # If the user is already authenticated, return an error
            logger.warning(f"Registration attempt by already authenticated user: {request.user.email}")
            return error_response(
                ErrorType.BAD_REQUEST,
                "You are already logged in",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        serializer = AuthAccSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.create(serializer.validated_data)

            tokengen = VerificationToken(user=user, reason="email_verification")
            token = tokengen.generate_token()

            mail_template = get_template(
                "verify_email",
                app_name=APP_NAME,
                email=user.email,
                code=token,
                base_url=BASE_URL,
            )

            sendmail(user.email, f"{APP_NAME} Email Verification", mail_template)
            logger.info(f"User registered successfully: {user.email} (ID: {user.id}). Verification email sent.")

            return success_response(
                f"Verification Email Sent To {user.email}",
                data={"user_id": user.id},
                status_code=status.HTTP_201_CREATED
            )
        logger.error(f"Registration failed for email {request.data.get('email', 'N/A')}: {serializer.errors}")
        return error_response(
            ErrorType.VALIDATION_ERROR,
            "Registration validation failed",
            details={"validation_errors": serializer.errors},
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return handle_exception(e, "User registration", "Failed to register user. Please try again.")


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate=settings.RATE_LIMITS['auth']['login'], method='POST')
def login(request: Request):
    """
    Login a user.
    """
    try:
        email = request.data.get("email")
        logger.info(f"Login attempt for email: {email}")
        
        if request.user.is_authenticated:
            # If the user is already authenticated, return an error
            logger.warning(f"Login attempt by already authenticated user: {request.user.email}")
            return error_response(
                ErrorType.BAD_REQUEST,
                "You are already logged in",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        password = request.data.get("password")

        if not email or not password:
            logger.warning("Login attempt with missing credentials")
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Email and password are required",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = authenticate(email=email, password=password)
        except ValueError:
            user = AuthAcc.objects.filter(email=email).first()
            if not user:
                return error_response(
                    ErrorType.AUTHENTICATION_ERROR,
                    "Invalid credentials",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            logger.warning(f"Unverified user login attempt: {email}")
            tokengen = VerificationToken(user=user, reason="email_verification")
            token = tokengen.generate_token()
            mail_template = get_template(
                "verify_email",
                app_name=APP_NAME,
                email=user.email,
                code=token,
                base_url=BASE_URL,
            )

            sendmail(user.email, f"{APP_NAME} Email Verification", mail_template)
            logger.info(f"Verification email resent to unverified user: {email}")
            return error_response(
                ErrorType.AUTHENTICATION_ERROR,
                f"User Not Verified. Verification Email Sent To {user.email}",
                status_code=status.HTTP_201_CREATED
            )

        if not user:
            logger.warning(f"Failed login attempt for email: {email} - Invalid credentials")
            return error_response(
                ErrorType.AUTHENTICATION_ERROR,
                "Invalid credentials",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user.set_last_login()

        refresh = RefreshToken.for_user(user)

        # Create response using success_response
        response = success_response(
            "Login successful",
            data={
                "user_id": user.id,
                "email": user.email,
            }
        )

        # Set httpOnly cookies for tokens
        response.set_cookie(
            "refresh_token",
            str(refresh),
            max_age=60 * 60 * 24 * 7,  # 7 days
            httponly=True,
            secure=not settings.DEBUG,  # Use HTTPS in production only
            samesite="Lax",
        )

        response.set_cookie(
            "access_token",
            str(refresh.access_token),
            max_age=60 * 5,  # 5 minutes
            httponly=True,
            secure=not settings.DEBUG,  # Use HTTPS in production only
            samesite="Lax",
        )

        logger.info(f"User logged in successfully: {email} (ID: {user.id})")
        return response
    except Exception as e:
        return handle_exception(e, "User login", "Failed to log in. Please try again.")


@api_view(["GET"])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate=settings.RATE_LIMITS['auth']['verify_email'], method='GET')
def verify(request: Request):
    """
    Verify the user's email using the token.
    """
    try:
        email = request.query_params.get("email")
        token = request.query_params.get("code")
        
        logger.info(f"Email verification attempt for: {email}")
        
        if not email or not token:
            logger.warning(f"Email verification missing parameters: email={email}, token={bool(token)}")
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Email and verification code are required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        manager = AuthAccManager()
        user = manager.get_user(email)
        
        if not user:
            logger.warning(f"Email verification failed: user not found for {email}")
            return error_response(
                ErrorType.NOT_FOUND,
                "User not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        try:
            if not VerificationToken.check(user, token, "email_verification"):
                logger.warning(f"Invalid verification token for user: {email}")
                return error_response(
                    ErrorType.VALIDATION_ERROR,
                    "Invalid or expired verification code",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # If the token is valid, mark the user as verified
            if user.is_verified:
                logger.info(f"User already verified: {email}")
                return error_response(
                    ErrorType.BAD_REQUEST,
                    "User already verified",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            user.verified = True
            user.save(using=manager._db)
            VerificationToken.delete(user)
            logger.info(f"Email verified successfully for user: {email} (ID: {user.id})")
            
            return success_response(
                "Email verified successfully",
                status_code=status.HTTP_200_OK
            )
        except ValueError as e:
            logger.error(f"Verification error for {email}: {str(e)}")
            return error_response(
                ErrorType.VALIDATION_ERROR,
                str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return handle_exception(e, "Email verification", "Failed to verify email. Please try again.")


@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate=settings.RATE_LIMITS['auth']['change_password'], method='POST')
def change_password(request: Request):
    """
    Change the user's password.
    """
    try:
        email = request.data.get("email")
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        
        logger.info(f"Password change attempt for email: {email}")

        if not email or not old_password or not new_password:
            logger.warning(f"Password change missing required fields for {email}")
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Email, old password and new password are required",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user = AuthAcc.objects.filter(email=email).first()

        if not user:
            logger.warning(f"Password change attempted for non-existent user: {email}")
            return error_response(
                ErrorType.NOT_FOUND,
                "User not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if not user.check_password(old_password):
            logger.warning(f"Incorrect old password for user: {email}")
            return error_response(
                ErrorType.AUTHENTICATION_ERROR,
                "Old password is incorrect",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        
        logger.info(f"Password changed successfully for user: {email} (ID: {user.id})")

        return success_response(
            "Password changed successfully",
            status_code=status.HTTP_200_OK
        )
    except Exception as e:
        return handle_exception(e, "Password change", "Failed to change password. Please try again.")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate=settings.RATE_LIMITS['profile']['get_user'], method='GET')
def user_profile(request: Request):
    """
    Get the authenticated user's profile.
    """
    try:
        user = request.user
        logger.info(f"Profile request for user: {user.email} (ID: {user.id})")
        serializer = AuthAccSerializer(user)
        
        return success_response(
            "Profile retrieved successfully",
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    except Exception as e:
        return handle_exception(e, "Get user profile", "Failed to retrieve profile. Please try again.")


@api_view(["POST", "GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate=settings.RATE_LIMITS['auth']['logout'], method=['POST', 'GET', 'PUT', 'DELETE'])
def logout(request: Request):
    """
    Logout the user by blacklisting the refresh token.
    """
    try:
        user_info = request.user.email if request.user.is_authenticated else "Anonymous"
        logger.info(f"Logout attempt by: {user_info}")
        
        # Try to get refresh token from cookies first, then from request data
        refresh_token = request.COOKIES.get("refresh_token") or request.data.get(
            "refresh"
        )

        # Always clear cookies, even if token processing fails
        response = success_response("Logged out successfully", status_code=status.HTTP_205_RESET_CONTENT)

        # Clear refresh token cookie
        response.delete_cookie("refresh_token", path="/")

        # Clear access token cookie
        response.delete_cookie("access_token", path="/")

        # Also clear any CSRF token cookie that might exist
        response.delete_cookie("csrftoken", path="/")

        # Try to blacklist the refresh token if it exists and is valid
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
                logger.info(f"User logged out successfully: {user_info}")
            except Exception as e:
                # Token might already be invalid/blacklisted, which is fine for logout
                logger.info(f"User logged out (token already invalid): {user_info}")
        else:
            logger.info(f"User logged out (no token found): {user_info}")

        return response
    except Exception as e:
        # Even on error, return success for logout (fail-safe approach)
        logger.error(f"Logout error for {user_info}: {str(e)}")
        response = success_response("Logged out successfully", status_code=status.HTTP_205_RESET_CONTENT)
        response.delete_cookie("refresh_token", path="/")
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("csrftoken", path="/")
        return response


@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate=settings.RATE_LIMITS['auth']['refresh_token'], method='POST')
def get_access_token(request: Request):
    """
    Get access token using refresh token.
    """
    try:
        from rest_framework_simplejwt.exceptions import TokenError
        
        logger.info("Access token refresh attempt")
        
        # Try to get refresh token from cookies first, then from request data
        refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh")
        
        if not refresh_token:
            logger.warning("Access token refresh attempted without refresh token")
            return error_response(
                ErrorType.AUTHENTICATION_ERROR,
                "Refresh token is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            user_email = refresh.get("email", "Unknown")
            logger.info(f"Access token refreshed for: {user_email}")
            
            # Create response and set new access token cookie
            response = success_response(
                "Access token refreshed successfully",
                data={"access": access_token},
                status_code=status.HTTP_200_OK
            )
            response.set_cookie(
                "access_token",
                access_token,
                max_age=60 * 5,  # 5 minutes
                httponly=True,
                secure=not settings.DEBUG,  # Use HTTPS in production only
                samesite="Lax",
            )
            return response
            
        except TokenError as e:
            logger.warning(f"Invalid refresh token: {str(e)}")
            return error_response(
                ErrorType.AUTHENTICATION_ERROR,
                "Invalid or expired refresh token. Please log in again.",
                details={"error": str(e)},
                status_code=status.HTTP_401_UNAUTHORIZED
            )

    except Exception as e:
        return handle_exception(
            e,
            context="token_refresh",
            user_message="Failed to refresh access token. Please log in again."
        )


@api_view(["POST", "GET"])
@permission_classes([IsAuthenticated])
@ratelimit(key='user_or_ip', rate=settings.RATE_LIMITS['api']['general'], method=['POST', 'GET'])
def is_authenticated(request: Request):
    """
    Check if the user is authenticated.
    """
    try:
        return success_response(
            "User is authenticated",
            data={"email": request.user.email, "is_staff": request.user.is_staff},
            status_code=status.HTTP_200_OK
        )
    except Exception as e:
        return handle_exception(
            e,
            context="authentication_check",
            user_message="Failed to verify authentication status"
        )
