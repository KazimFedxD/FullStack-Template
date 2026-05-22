"""
Security sanitization utilities for input validation and cleaning.

Provides functions to sanitize text inputs, validate binary data,
and prevent common attack vectors (XSS, malicious uploads).

SQL Injection Protection:
- Handled automatically by Django ORM's parameterized queries
- ORM never concatenates user input directly into SQL
- No need for manual SQL pattern detection

XSS Protection:
- Pattern matching for dangerous HTML/JavaScript
- HTML tag stripping for user-generated content
- Event handler detection

Audio Validation:
- Size limits to prevent DoS attacks
- Format validation for streaming audio (lenient for continuation chunks)
"""

from __future__ import annotations
import re
import logging
from typing import Any

logger = logging.getLogger("utils")

# Note: SQL injection is prevented by Django ORM's parameterized queries.
# We don't need regex patterns for SQL injection detection.
# The ORM never concatenates user input directly into SQL strings.

# Dangerous XSS patterns that might indicate attacks
XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"on\w+\s*=",  # Event handlers like onclick, onload
    r"<iframe",
    r"<object",
    r"<embed",
]

# WebM file magic bytes (EBML header)
WEBM_MAGIC_BYTES = bytes([0x1A, 0x45, 0xDF, 0xA3])

# Max sizes
MAX_TEXT_LENGTH = 10000  # 10KB for text inputs
MAX_TOPIC_LENGTH = 255
MAX_JSON_PAYLOAD_SIZE = 10240  # 10KB
MAX_AUDIO_CHUNK_SIZE = 1048576  # 1MB


def sanitize_text(
    text: str,
    max_length: int = MAX_TEXT_LENGTH,
    allow_html: bool = False,
    field_name: str = "input",
) -> str:
    """
    Sanitize text input to prevent XSS attacks.

    Note: SQL injection is prevented by Django ORM's parameterized queries,
    so we don't need to check for SQL patterns here.

    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length
        allow_html: Whether to allow HTML tags (default: False)
        field_name: Name of the field for logging

    Returns:
        Sanitized text string

    Raises:
        ValueError: If input contains malicious patterns
    """
    if not isinstance(text, str):
        raise ValueError(f"{field_name} must be a string")

    # Check length
    if len(text) > max_length:
        logger.warning(f"Text input exceeds max length ({len(text)} > {max_length})")
        text = text[:max_length]

    # Check for XSS patterns
    for pattern in XSS_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            logger.error(f"Potential XSS attack detected in {field_name}: {text[:100]}")
            raise ValueError(f"Invalid HTML/JavaScript detected in {field_name}")

    # Strip HTML tags if not allowed
    if not allow_html:
        text = re.sub(r"<[^>]+>", "", text)

    # Remove null bytes
    text = text.replace("\x00", "")

    # Normalize whitespace
    text = " ".join(text.split())

    return text.strip()


def sanitize_topic(topic: str) -> str:
    """
    Sanitize session topic input with strict validation.

    Args:
        topic: Topic string from user

    Returns:
        Sanitized topic string

    Raises:
        ValueError: If topic is invalid
    """
    topic = sanitize_text(topic, max_length=MAX_TOPIC_LENGTH, field_name="topic")

    # Only allow alphanumeric, spaces, and basic punctuation
    if not re.match(r'^[a-zA-Z0-9\s\-_.,!?()\'"]+$', topic):
        logger.warning(f"Topic contains invalid characters: {topic[:50]}")
        raise ValueError(
            "Topic contains invalid characters. Only letters, numbers, spaces, and basic punctuation allowed."
        )

    if len(topic) < 3:
        raise ValueError("Topic must be at least 3 characters long")

    return topic


def validate_event_type(event_type: str) -> bool:
    """
    Validate WebSocket event type format.

    Args:
        event_type: Event type string

    Returns:
        True if valid, False otherwise
    """
    if not isinstance(event_type, str):
        return False

    # Only allow alphanumeric and underscore
    if not re.match(r"^[a-z_][a-z0-9_]*$", event_type):
        logger.warning(f"Invalid event type format: {event_type}")
        return False

    if len(event_type) > 50:
        logger.warning(f"Event type too long: {len(event_type)}")
        return False

    return True


def sanitize_json_payload(
    payload: dict[Any, Any], max_size: int = MAX_JSON_PAYLOAD_SIZE, depth: int = 10
) -> dict[Any, Any]:
    """
    Sanitize JSON payload from WebSocket.

    Args:
        payload: Dictionary payload
        max_size: Maximum payload size in bytes
        depth: Maximum recursion depth (default: 10)

    Returns:
        Sanitized payload

    Raises:
        ValueError: If payload is invalid
    """
    if not isinstance(payload, dict):
        raise ValueError("Payload must be a dictionary")

    # Check payload size (approximate)
    import json

    payload_str = json.dumps(payload)
    if len(payload_str) > max_size:
        logger.error(f"Payload too large: {len(payload_str)} bytes")
        raise ValueError("Payload too large")

    # Validate event type if present
    if "type" in payload:
        if not validate_event_type(payload["type"]):
            raise ValueError("Invalid event type format")

    # Recursively sanitize string values
    sanitized: dict[Any, Any] = {}
    for key, value in payload.items():
        if isinstance(key, str):
            # Sanitize keys
            key = sanitize_text(key, max_length=100, field_name="payload key")

        if isinstance(value, str):
            # Sanitize string values
            value = sanitize_text(value, max_length=5000, field_name=f"payload.{key}")
        elif isinstance(value, dict):
            # Recursively sanitize nested dicts with depth guard
            if depth <= 0:
                value = {}  # Return empty dict if depth exhausted
            else:
                value = sanitize_json_payload(
                    value, max_size=max_size // 2, depth=depth - 1
                )
        elif isinstance(value, list):
            # Recursively sanitize list items with depth guard
            sanitized_list = []
            for item in value[:100]:  # Limit list size
                if isinstance(item, str):
                    sanitized_list.append(
                        sanitize_text(
                            item, max_length=1000, field_name=f"payload.{key}[]"
                        )
                    )
                elif isinstance(item, dict):
                    if depth <= 0:
                        sanitized_list.append(
                            {}
                        )  # Return empty dict if depth exhausted
                    else:
                        sanitized_list.append(
                            sanitize_json_payload(
                                item, max_size=max_size // 2, depth=depth - 1
                            )
                        )
                elif isinstance(item, list):
                    # Handle nested lists recursively with depth guard
                    if depth <= 0:
                        sanitized_list.append(
                            []
                        )  # Return empty list if depth exhausted
                    else:
                        nested_dict = {"nested_list": item}
                        sanitized_nested = sanitize_json_payload(
                            nested_dict, max_size=max_size // 2, depth=depth - 1
                        )
                        sanitized_list.append(sanitized_nested["nested_list"])
                else:
                    sanitized_list.append(item)
            value = sanitized_list

        sanitized[key] = value

    return sanitized


def validate_audio_bytes(audio_bytes: bytes, check_header: bool = False) -> bool:
    """
    Validate that bytes represent valid audio data.

    Note: In streaming scenarios, only the first chunk has a WebM header.
    Subsequent chunks are raw audio data without headers.

    Args:
        audio_bytes: Binary audio data
        check_header: If True, validates WebM header (use for first chunk only)

    Returns:
        True if valid, False otherwise
    """
    if not isinstance(audio_bytes, bytes):
        logger.error("Audio data is not bytes type")
        return False

    # Check size limits
    if len(audio_bytes) > MAX_AUDIO_CHUNK_SIZE:
        logger.error(f"Audio chunk too large: {len(audio_bytes)} bytes")
        return False

    if len(audio_bytes) == 0:
        logger.warning("Audio chunk is empty")
        return False

    # Only check WebM header if explicitly requested (for first chunk)
    if check_header and len(audio_bytes) >= 4:
        if audio_bytes[:4] != WEBM_MAGIC_BYTES:
            logger.warning(
                f"Audio data missing WebM header (EBML), size: {len(audio_bytes)}"
            )
            return False

    # Basic validation passed
    return True


def validate_grade_level(grade_level: Any) -> int:
    """
    Validate and sanitize grade level input.

    Args:
        grade_level: Grade level value (int or string)

    Returns:
        Validated integer grade level

    Raises:
        ValueError: If grade level is invalid
    """
    try:
        grade = int(grade_level)
    except (ValueError, TypeError):
        raise ValueError("Grade level must be a number") from None

    if grade < 1 or grade > 12:
        raise ValueError("Grade level must be between 1 and 12")

    return grade


__all__ = [
    "sanitize_text",
    "sanitize_topic",
    "validate_event_type",
    "sanitize_json_payload",
    "validate_audio_bytes",
    "validate_grade_level",
]
