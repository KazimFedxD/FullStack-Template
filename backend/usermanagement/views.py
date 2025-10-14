from __future__ import annotations

from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken


from .serializers import AuthAccSerializer
from .models import AuthAcc, AuthAccManager, VerificationToken, authenticate

from custom import sendmail, get_template, debug

from dotenv import load_dotenv
import os

load_dotenv()

WEBSITE_NAME = os.getenv("WEBSITE_NAME", "Template")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

# Create your views here.


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def register(request: Request):
    """
    Register a new user.
    """
    if request.user.is_authenticated:
        # If the user is already authenticated, return an error
        return Response({"error": "User already authenticated"}, status=400)
    debug(request.__dict__)
    serializer = AuthAccSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.create(serializer.validated_data)

        tokengen = VerificationToken(user=user, reason="email_verification")
        token = tokengen.generate_token()

        mail_template = get_template(
            "verify_email",
            WEBSITE_NAME=WEBSITE_NAME,
            email=user.email,
            token=token,
            BASE_URL=BASE_URL,
            type="email_verification",
        )

        sendmail(user.email, "Skyntel Email Verification", mail_template)

        return Response(
            {"message": f"Verification Email Sent To {user.email}", "user_id": user.id},
            status=201,
        )
    return Response(serializer.errors, status=400)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def login(request: Request):
    """
    Login a user.
    """
    if request.user.is_authenticated:
        # If the user is already authenticated, return an error
        return Response({"error": "User already authenticated"}, status=400)

    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Email and password are required"}, status=400)

    try:
        user = authenticate(email=email, password=password)
    except ValueError:
        user = AuthAcc.objects.filter(email=email).first()
        tokengen = VerificationToken(user=user, reason="email_verification")
        token = tokengen.generate_token()
        debug(f"{token=}")
        mail_template = get_template(
            "verify_email",
            WEBSITE_NAME=WEBSITE_NAME,
            email=user.email,
            token=token,
            BASE_URL=BASE_URL,
            type="email_verification",
        )

        sendmail(user.email, "Skyntel Email Verification", mail_template)
        return Response(
            {"error": f"User Not Verified. Verification Email Sent To {user.email}"},
            status=201,
        )

    if not user:
        return Response({"error": "Invalid credentials"}, status=400)

    user.set_last_login()

    refresh = RefreshToken.for_user(user)

    # Create response
    response = Response(
        {
            "message": "Login successful",
            "user_id": user.id,
            "email": user.email,
        },
        status=200,
    )
    
    # Set httpOnly cookies for tokens
    response.set_cookie(
        'refresh_token',
        str(refresh),
        max_age=60 * 60 * 24 * 7,  # 7 days
        httponly=True,
        secure=not settings.DEBUG,  # Use HTTPS in production only
        samesite='Lax'
    )
    
    response.set_cookie(
        'access_token', 
        str(refresh.access_token),
        max_age=60 * 5,  # 5 minutes
        httponly=True,
        secure=not settings.DEBUG,  # Use HTTPS in production only
        samesite='Lax'
    )
    
    return response


@api_view(["GET"])
@permission_classes([AllowAny])
def verify(request: Request):
    """
    Verify the user's email using the token.
    """

    debug(request.data, request.__dict__)

    email = request.query_params.get("email")
    token = request.query_params.get("token")
    type_ = request.query_params.get("type", "email_verification")
    if not email or not token:
        return Response({"error": "Email and token are required"}, status=400)
    match type_:
        case "email_verification":
            manager = AuthAccManager()
            user = manager.get_user(email)
            try:
                if not VerificationToken.check(user, token, type_):
                    return Response({"error": "Invalid Token"}, status=400)
                # If the token is valid, mark the user as verified
                if user.is_verified:
                    return Response({"error": "User already verified"}, status=400)
                user.verified = True
                user.save(using=manager._db)
                VerificationToken.delete(user)
                return Response({"message": "Email verified successfully"}, status=200)
            except ValueError as e:
                return Response({"error": str(e)}, status=400)
        case _:
            return Response({"error": "Invalid reason"}, status=400)


@api_view(["GET"])
@permission_classes([AllowAny])
def change_password(request: Request):
    """
    Change the user's password.
    """
    email = request.data.get("email")
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")

    if not email or not old_password or not new_password:
        return Response(
            {"error": "Email, old password and new password are required"}, status=400
        )

    user = AuthAcc.objects.filter(email=email).first()

    if not user:
        return Response({"error": "User not found"}, status=404)

    if not user.check_password(old_password):
        return Response({"error": "Old password is incorrect"}, status=400)

    user.set_password(new_password)
    user.save()

    return Response({"message": "Password changed successfully"}, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile(request: Request):
    """
    Get the authenticated user's profile.
    """
    user = request.user
    serializer = AuthAccSerializer(user)
    return Response(serializer.data, status=200)


@api_view(["POST", "GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def logout(request: Request):
    """
    Logout the user by blacklisting the refresh token.
    """
    try:
        # Try to get refresh token from cookies first, then from request data
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get("refresh")
        
        # Always clear cookies, even if token processing fails
        response = Response({"message": "Logged out successfully"}, status=205)
        
        # Clear refresh token cookie
        response.delete_cookie(
            'refresh_token',
            path='/'
        )
        
        # Clear access token cookie  
        response.delete_cookie(
            'access_token',
            path='/'
        )
        
        # Also clear any CSRF token cookie that might exist
        response.delete_cookie(
            'csrftoken',
            path='/'
        )
        
        # Try to blacklist the refresh token if it exists and is valid
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception as e:
                # Token might already be invalid/blacklisted, which is fine for logout
                debug(f"Token blacklist failed (this is OK for logout): {e}")
        
        return response
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(["POST"])
@permission_classes([AllowAny])
def get_access_token(request: Request):
    """
    Get access token using refresh token.
    """
    try:
        # Try to get refresh token from cookies first, then from request data
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "Refresh token is required"}, status=400)
        try:
            refresh = RefreshToken(refresh_token)
        except Exception:
            return Response({"error": "Invalid refresh token"}, status=400)
        
        access_token = str(refresh.access_token)

        # Create response and set new access token cookie
        response = Response({"access": access_token}, status=200)
        response.set_cookie(
            'access_token', 
            access_token,
            max_age=60 * 5,  # 5 minutes
            httponly=True,
            secure=not settings.DEBUG,  # Use HTTPS in production only
            samesite='Lax'
        )
        
        return response

    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(["POST", "GET"])
@permission_classes([IsAuthenticated])
def is_authenticated(request: Request):
    """
    Check if the user is authenticated.
    """
    return Response({}, status=200)
