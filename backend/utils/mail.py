from __future__ import annotations

from dotenv import load_dotenv
import os
import logging
from typing import Any

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email_validator import EmailNotValidError, validate_email
import smtplib

logger = logging.getLogger("utils")

load_dotenv()


SENDER = os.getenv("EMAIL")
S_PASS = os.getenv("EMAIL_PASS")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 465))

if not SENDER or not S_PASS:
    logger.warning("Email or Email Password not set in .env file")


def sendmail(receiver: str, subject: str, html: str) -> bool:
    """Send an email using SMTP
    
    Args:
        receiver: Email address of the recipient
        subject: Subject of the email
        html: HTML content of the email
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not SENDER or not S_PASS:
        raise ValueError("Email and Password not set in .env file")
    try:
        v = validate_email(receiver)
        receiver = v.email
    except EmailNotValidError as e:
        logger.debug(e)
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SENDER
        msg["To"] = receiver

        part = MIMEText(html, "html")
        msg.attach(part)

        with smtplib.SMTP_SSL(EMAIL_HOST, EMAIL_PORT) as smtp:
            smtp.login(SENDER, S_PASS)
            smtp.sendmail(SENDER, receiver, msg.as_string())
            smtp.quit()
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {receiver}: {e}")
        return False
    

def get_template(template_name: str, **kwargs: Any) -> str:
    """Get Email Template and populate with kwargs
    
    Args:
        template_name: Name of the template file (without .html extension)
        **kwargs: Variables to populate in the template
        
    Returns:
        str: Populated HTML template
    """
    with open("email_templates/base.html", "r") as f:
        base_template = f.read()
    with open(f"email_templates/{template_name}.html", "r") as f:
        template = f.read()
    return base_template + template.format(**kwargs)
