from __future__ import annotations

from cryptography.fernet import Fernet
from dotenv import load_dotenv
import os
import logging

load_dotenv()

logger = logging.getLogger("utils")

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    logger.warning("Encryption key not set in .env file, generating a new one")
    key = Fernet.generate_key()
    with open(".env", "a") as f:
        f.write(f"\nENCRYPTION_KEY={key.decode()}")
    ENCRYPTION_KEY = key.decode()

def encrypt(text: str) -> str:
    """Encrypt text using Fernet encryption
    
    Args:
        text (str): The text to be encrypted

    Returns:
        str: Encrypted text
    """
    fernet = Fernet(ENCRYPTION_KEY)
    encrypted = fernet.encrypt(text.encode()).decode()
    return encrypted


def decrypt(text: str) -> str:
    """Decrypt text using Fernet encryption
    
    Args:
        text (str): The text to be decrypted

    Returns:
        str: Decrypted text
    """
    fernet = Fernet(ENCRYPTION_KEY)
    decrypted = fernet.decrypt(text.encode()).decode()
    return decrypted
