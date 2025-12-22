from __future__ import annotations

from django.conf import settings
from django_ratelimit.decorators import ratelimit
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from dotenv import load_dotenv

import os
from email_validator import validate_email, EmailNotValidError

import logging

from utils.mail import sendmail, get_template
from utils.error_handler import error_response, success_response, handle_exception, ErrorType

load_dotenv()
logger = logging.getLogger("api")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
APP_NAME = os.getenv("APP_NAME", "Template")
BASE_URL = os.getenv("BASE_URL", "http://localhost")

if not ADMIN_EMAIL:
    logger.warning("ADMIN_EMAIL not set in .env file")

if not APP_NAME:
    logger.warning("APP_NAME not set in .env file")

@permission_classes([AllowAny])
@api_view(['POST'])
@ratelimit(key='ip', rate=settings.RATE_LIMITS['api']['contact'], method='POST')
def contact(request: Request) -> Response:
    """Handle contact form submissions"""
    try:
        if not ADMIN_EMAIL:
            logger.error("Contact form attempted but ADMIN_EMAIL not configured")
            return error_response(
                ErrorType.SERVER_ERROR,
                "Contact form is not configured. Please try again later.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                log_error=True
            )
        
        name = request.data.get('name')
        email = request.data.get('email')
        subject = request.data.get('subject')
        message = request.data.get('message')

        # Validate required fields
        if not all([name, email, subject, message]):
            missing_fields = [
                field for field, value in {
                    'name': name, 'email': email, 
                    'subject': subject, 'message': message
                }.items() if not value
            ]
            logger.warning(f"Contact form submission missing fields: {missing_fields}")
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "All fields are required",
                details={"missing_fields": missing_fields},
                status_code=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"Received contact form submission from {email}")

        # Validate email format
        try:
            valid = validate_email(email)
            email = valid.normalized
        except EmailNotValidError as e:
            logger.error(f"Invalid email in contact form: {email} - {str(e)}")
            return error_response(
                ErrorType.VALIDATION_ERROR,
                "Please provide a valid email address",
                details={"email": str(e)},
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Get email templates (create these templates if they don't exist)
        # For now, using simple email content
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
        
        # Send email to admin
        sent = sendmail(ADMIN_EMAIL, f"New contact form submission: {subject}", to_admin)
        if not sent:
            logger.error(f"Failed to send contact form details to admin from {email}")
            return error_response(
                ErrorType.EXTERNAL_API_ERROR,
                "Failed to send your message. Please try again later.",
                details={"stage": "admin_notification"},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                log_error=True
            )
        
        # Send acknowledgment to user
        sent = sendmail(email, f"Thank you for contacting {APP_NAME}", to_user)
        if not sent:
            logger.error(f"Failed to send contact form acknowledgment to {email}")
            # This is less critical - user's message was received
            logger.warning(f"Contact form received from {email} but acknowledgment failed")

        logger.info(f"Contact form processed successfully for {email}")
        return success_response(
            "Your message has been sent successfully. We'll get back to you soon!",
            status_code=status.HTTP_200_OK
        )
        
    except Exception as e:
        return handle_exception(
            e,
            context="contact_form",
            user_message="Failed to send your message. Please try again later or contact us directly."
        )
