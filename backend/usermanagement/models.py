from __future__ import annotations

from typing import Any, Optional

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.db.models import *
from django.utils.translation import gettext_lazy as _

from email_validator import EmailNotValidError, validate_email

from celery import shared_task
import datetime
import random
import string

from custom import debug

# Create your models here.

alpha = string.ascii_uppercase
digits = string.digits

VERIFICATION_TOKENS: list[VerificationToken] = []


@shared_task
def clear_verification_tokens() -> None:
    """Clear expired verification tokens."""
    global VERIFICATION_TOKENS
    debug("Checking for expired verification tokens...")
    expired: list[VerificationToken] = []
    for token in VERIFICATION_TOKENS[
        :
    ]:  # Create a copy to avoid modification during iteration
        token.timeout -= 1
        if token.timeout <= 0:
            expired.append(token)
    for token in expired:
        token.del_self()


class VerificationToken:
    token: str
    timeout: int

    def __init__(self, user: AuthAcc, reason: str) -> None:
        self.user = user
        self.reason = reason

    def _gen(self) -> str:
        aplhatoken = random.choices(alpha, k=3)
        digtoken = random.choices(digits, k=3)
        token = aplhatoken + digtoken
        random.shuffle(token)
        return "".join(token)

    def generate_token(self, new: bool = False) -> str:
        """Generate a new token for the user

        Args:
            new (bool, optional): If User Alr Has A token make a new token. Defaults to False.

        Returns:
            str: TOKEN
        """
        usertoken = VerificationToken.get_user(self.user)
        if usertoken:
            if new:
                token = self._gen()
                usertoken.token = token
            usertoken.timeout = 10
            return usertoken.token
        token = self._gen()
        self.token = token
        self.timeout = 10
        VERIFICATION_TOKENS.append(self)
        return self.token

    @staticmethod
    def check(user: AuthAcc, token: str, reason: str) -> bool:
        usertoken = VerificationToken.get_user(user)
        if not usertoken:
            raise ValueError("User Token Not Found")
        if usertoken.token == token:
            if usertoken.reason == reason:
                usertoken.del_self()
                return True
            else:
                raise ValueError("Invalid Reason")
        return False

    @staticmethod
    def get_user(user: AuthAcc) -> Optional[VerificationToken]:
        for token in VERIFICATION_TOKENS:
            if token.user == user:
                return token
        return None

    def del_self(self) -> None:
        token = VerificationToken.get_user(self.user)
        if token:
            VERIFICATION_TOKENS.remove(token)
            del token
            del self
        else:
            del self

    @staticmethod
    def delete(user: AuthAcc) -> None:
        token = VerificationToken.get_user(user)
        if token:
            token.del_self()


class AuthAccManager(BaseUserManager):
    def create_user(
        self, email: str, username: Optional[str], password: Optional[str], **extra: Any
    ) -> AuthAcc:
        if not email:
            raise ValueError("Email is required")
        if not username:
            username = email[: email.index("@")]
        try:
            self.validate(email=email, username=username)
        except ValueError as e:
            raise ValueError(f"Validation Error: {e}")
        acc = self.get_user(email=email)
        if acc:
            raise ValueError("Email In Use")

        user = AuthAcc(email=email, username=username, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def validate(self, email: str, username: str):
        self.validate_email(email)
        self.validate_username(username)

    def validate_email(self, email: str):
        try:
            validate_email(email)
        except EmailNotValidError:
            raise ValueError("Invalid Email")
        acc = self.get_user(email=email)
        if acc:
            raise ValueError("Email already exists")

    def validate_username(self, username: str):
        if len(username) < 4:
            raise ValueError("Username must be at least 4 characters")
        if len(username) > 25:
            raise ValueError("Username must be less than 25 characters")

    def has_module_perms(self, user: AuthAcc, app_label: str) -> bool:
        return user.is_superuser

    def create_superuser(
        self, email: str, username: str, password: Optional[str], **extra: Any
    ) -> AuthAcc:
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self.create_user(email, username, password, **extra)

    def get_by_natural_key(self, email: str) -> AuthAcc:
        return self.get(email=email)

    def get_email_field_name(self) -> str:
        return "email"

    def normalize_username(self, username: str) -> str:
        return username

    def normalize_email(self, email: str) -> str:
        return email

    def get_username_field(self) -> str:
        return "email"

    def get_user(self, email: str) -> AuthAcc:
        acc = AuthAcc.objects.filter(email=email).first()
        if acc:
            return acc
        return None

    def get_user_by_natural_key(self, email: str) -> AuthAcc:
        return self.get(email=email)

    def natural_key(self) -> str:
        return self.email


class AuthAcc(AbstractBaseUser):
    email = EmailField(max_length=100, unique=True)
    username = CharField(max_length=100)
    password = models.CharField(_("password"), max_length=128)
    verified = models.BooleanField(
        default=False,
        help_text=_("Designates whether the user has verified their email address."),
    )
    __reset_pass: bool = False
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    is_staff = models.BooleanField(
        default=False,
        help_text=("Designates whether the user can log into this admin site."),
    )
    is_superuser = models.BooleanField(
        default=False,
        help_text=(
            "Designates that this user has all permissions without explicitly assigning them."
        ),
    )
    is_active = models.BooleanField(
        default=True,
        help_text=(
            "Designates whether this user should be treated as active. "
            "Unselect this instead of deleting AuthAccs."
        ),
    )

    last_login = models.DateTimeField(
        _("last login"), blank=True, null=True, editable=False
    )

    objects = AuthAccManager()

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    def has_module_perms(self, app_label: str) -> bool:
        return self.is_superuser

    @property
    def reset_pass(self) -> bool:
        return self.__reset_pass

    @property
    def is_verified(self) -> bool:
        return self.verified

    @property
    def is_admin(self) -> bool:
        return self.is_staff or self.is_superuser

    def has_perm(self, perm: str, obj: Optional[Any] = None) -> bool:
        return self.is_staff

    def __str__(self) -> str:
        return self.email

    def set_last_login(self) -> None:
        self.last_login = datetime.datetime.now()
        self.save(update_fields=["last_login"])


def authenticate(email: str, password: str) -> Optional[AuthAcc]:
    try:
        validate_email(email)
    except EmailNotValidError:
        return None
    self = AuthAccManager()
    user = self.get_user(email=email)
    if not user:
        return None
    if not user.verified:
        raise ValueError("User Not Verified")
    if user.check_password(password):
        return user
    return None
