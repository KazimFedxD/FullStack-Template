from __future__ import annotations

from typing import Any

from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from .models import AuthAcc, VerificationToken


def mask_email(email: str) -> str:
    local_part, _, domain = email.partition("@")
    if not domain:
        return email
    visible = local_part[:1] or "*"
    return f"{visible}***@{domain}"


def serialize_user(user: AuthAcc) -> dict[str, Any]:
    return {
        "user_id": str(user.id),
        "user_email": user.email,
        "username": user.username,
        "verified": user.verified,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    }


def issue_verification_token(user: AuthAcc, reason: str) -> str:
    token = VerificationToken(user=user, reason=reason)
    return token.generate_token(new=True)


def revoke_user_sessions(user: AuthAcc) -> int:
    revoked = 0
    outstanding_tokens = OutstandingToken.objects.filter(user=user)

    for outstanding_token in outstanding_tokens:
        try:
            BlacklistedToken.objects.get_or_create(token=outstanding_token)
            revoked += 1
        except Exception:
            continue

    return revoked