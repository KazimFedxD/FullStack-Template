from __future__ import annotations

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django_ratelimit.decorators import ratelimit
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from dotenv import load_dotenv

import os
from xml.sax.saxutils import escape
from email_validator import validate_email, EmailNotValidError

import logging

from utils.mail import sendmail
from utils.error_handler import (
    error_response,
    success_response,
    handle_exception,
    ErrorType,
)

load_dotenv()
logger = logging.getLogger("api")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
APP_NAME = os.getenv("APP_NAME", "Template")
BASE_URL = os.getenv("BASE_URL", "http://localhost")
SEO_CANONICAL_BASE_URL = os.getenv("SEO_CANONICAL_BASE_URL", "https://teachback.net").rstrip("/")

SITEMAP_PUBLIC_PATHS: tuple[tuple[str, str, str], ...] = (
    ("/", "daily", "1.0"),
    ("/about", "weekly", "0.8"),
    ("/patches", "weekly", "0.8"),
    ("/pricing", "weekly", "0.9"),
    ("/terms", "monthly", "0.5"),
    ("/privacy", "monthly", "0.5"),
)

if not ADMIN_EMAIL:
    logger.warning("ADMIN_EMAIL not set in .env file")

if not APP_NAME:
    logger.warning("APP_NAME not set in .env file")


@api_view(["GET"])
@permission_classes([AllowAny])
def sitemap_xml(request: Request) -> HttpResponse:
    """Serve an XML sitemap for public indexable routes."""
    last_modified = timezone.now().date().isoformat()

    url_nodes = []
    for path, changefreq, priority in SITEMAP_PUBLIC_PATHS:
        canonical_url = f"{SEO_CANONICAL_BASE_URL}{path}"
        url_nodes.append(
            "\n".join(
                [
                    "  <url>",
                    f"    <loc>{escape(canonical_url)}</loc>",
                    f"    <lastmod>{last_modified}</lastmod>",
                    f"    <changefreq>{changefreq}</changefreq>",
                    f"    <priority>{priority}</priority>",
                    "  </url>",
                ]
            )
        )

    xml = "\n".join(
        [
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
            "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
            *url_nodes,
            "</urlset>",
        ]
    )

    response = HttpResponse(xml, content_type="application/xml; charset=utf-8")
    response["Cache-Control"] = "public, max-age=3600"
    return response


@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate=settings.RATE_LIMITS["api"]["contact"], method="POST")
def contact(request: Request) -> Response:
    """Handle contact form submissions"""
    try:
        if not ADMIN_EMAIL:
            logger.error("Contact form attempted but ADMIN_EMAIL not configured")
            return error_response(
                ErrorType.SERVER_ERROR,
                "Contact form is not configured. Please try again later.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                log_error=True,
            )

        name = request.data.get("name")
        email = request.data.get("email")
        subject = request.data.get("subject")
        message = request.data.get("message")

        if not all([name, email, subject, message]):
            missing_fields = [
                field
                for field, value in {
                    "name": name,
                    "email": email,
                    "subject": subject,
                    "message": message,
                }.items()
                if not value
            ]
            logger.warning(f"Contact form submission missing fields: {missing_fields}")
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "All fields are required",
                details={"missing_fields": missing_fields},
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        logger.info(f"Received contact form submission from {email}")

        try:
            valid = validate_email(email)
            email = valid.normalized
        except EmailNotValidError as e:
            logger.error(f"Invalid email in contact form: {email} - {str(e)}")
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Please provide a valid email address",
                details={"email": str(e)},
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        to_admin = f"""
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Subject:</strong> {subject}</p>
        <p><strong>Message:</strong></p>
        <p>{message}</p>
        """

        to_user = f"""
        <h2>Thank you for contacting {APP_NAME}</h2>
        <p>Hi {name},</p>
        <p>We have received your message and will get back to you soon.</p>
        <p><strong>Your message:</strong></p>
        <p>{message}</p>
        <p>Best regards,<br>The {APP_NAME} Team</p>
        """

        sent = sendmail(
            ADMIN_EMAIL, f"New contact form submission: {subject}", to_admin
        )
        if not sent:
            logger.error(f"Failed to send contact form details to admin from {email}")
            return error_response(
                ErrorType.EXTERNAL_API_ERROR,
                "Failed to send your message. Please try again later.",
                details={"stage": "admin_notification"},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                log_error=True,
            )

        sent = sendmail(email, f"Thank you for contacting {APP_NAME}", to_user)
        if not sent:
            logger.error(f"Failed to send contact form acknowledgment to {email}")
            logger.warning(
                f"Contact form received from {email} but acknowledgment failed"
            )

        logger.info(f"Contact form processed successfully for {email}")
        return success_response(
            "Your message has been sent successfully. We'll get back to you soon!",
            status_code=status.HTTP_200_OK,
        )

    except Exception as e:
        return handle_exception(
            e,
            context="contact_form",
            user_message="Failed to send your message. Please try again later or contact us directly.",
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def is_admin(request: Request) -> Response:
    """Check if the user has admin or staff privileges"""
    try:
        user = request.user
        is_admin = user.is_staff or user.is_superuser
        logger.info(f"Admin check for user {user.email}: is_admin={is_admin}")
        return success_response(
            message="Admin status retrieved",
            data={"is_admin": is_admin},
            status_code=status.HTTP_200_OK,
        )
    except Exception as e:
        return handle_exception(
            e,
            context="is_admin_check",
            user_message="Failed to verify admin status. Please try again later.",
        )
