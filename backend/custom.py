from __future__ import annotations

from typing import Any, Literal

from rest_framework.request import Request
from rest_framework.permissions import BasePermission

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email_validator import EmailNotValidError, validate_email
import smtplib

from dotenv import load_dotenv
import os

from cryptography.fernet import Fernet

from backend import settings

load_dotenv()

SENDER = os.getenv("EMAIL")
S_PASS = os.getenv("EMAIL_PASS")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 465))
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not SENDER or not S_PASS:
    print("WARNING: Email and Password not set in .env file")
if not ENCRYPTION_KEY:
    key = Fernet.generate_key()
    with open(".env", "a") as f:
        f.write(f"\nENCRYPTION_KEY={key.decode()}")
    ENCRYPTION_KEY = key.decode()


def sendmail(receiver: str, subject: str, html: str) -> bool:
    if not SENDER or not S_PASS:
        raise ValueError("Email and Password not set in .env file")
    try:
        v = validate_email(receiver)
        receiver = v.email
    except EmailNotValidError as e:
        debug(e)
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SENDER
        msg["To"] = receiver

        part = MIMEText(html, "html")
        msg.attach(part)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(SENDER, S_PASS)
            smtp.sendmail(SENDER, receiver, msg.as_string())
            smtp.quit()
        return True
    except Exception as e:
        debug(e)
        return False


def encrypt(text: str) -> str:
    """_summary_

    Args:
        text (str): The text to be encrypted

    Returns:
        str: Encrypted text
    """
    fernet = Fernet(ENCRYPTION_KEY)
    encrypted = fernet.encrypt(text.encode()).decode()
    debug(encrypted)
    return encrypted


def decrypt(text: str) -> str:
    """_summary_

    Args:
        text (str): The text to be decrypted

    Returns:
        str: Decrypted text
    """
    fernet = Fernet(ENCRYPTION_KEY)
    decrypted = fernet.decrypt(text.encode()).decode()
    debug(decrypted)
    return decrypted


def debug(
    *values: object,
    sep: str | None = " ",
    end: str | None = "\n",
    file: Any | None = None,
    flush: Literal[False] = False,
) -> None:
    if settings.DEBUG:
        print(*values, sep=sep, end=end, file=file, flush=flush)


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


def get_template(name: str, **kwargs: Any) -> str:
    """Get Email Template"""
    with open("email_templates/base.html", "r") as f:
        base_template = f.read()
    with open(f"email_templates/{name}.html", "r") as f:
        template = f.read()
    return base_template + template.format(**kwargs)
