"""Shared helpers for registration and password reset."""
# @maintained quake-inventory-system

import re
import secrets
from datetime import timedelta
from typing import Optional

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .models import Membership, Organization, StaffInvite, User


def normalize_email(email: str) -> str:
    return email.strip().lower()


def unique_username_from_email(email: str) -> str:
    base = email.split("@")[0][:30] or "user"
    base = re.sub(r"[^\w.@+-]", "", base) or "user"
    username = base
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{counter}"
        counter += 1
    return username


def unique_org_slug(name: str) -> str:
    raw = name.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", raw).strip("-")[:60] or "business"
    candidate = slug
    counter = 1
    while Organization.objects.filter(slug=candidate).exists():
        candidate = f"{slug}-{counter}"
        counter += 1
    return candidate


def split_name(name: str) -> tuple[str, str]:
    parts = name.strip().split(" ", 1) if name else ["", ""]
    first = parts[0]
    last = parts[1] if len(parts) > 1 else ""
    return first, last


def create_user_account(
    *,
    email: str,
    password: str,
    name: str = "",
    role: str = User.Role.STAFF,
) -> User:
    first_name, last_name = split_name(name)
    user = User.objects.create_user(
        username=unique_username_from_email(email),
        email=normalize_email(email),
        password=password,
        first_name=first_name,
        last_name=last_name,
        role=role,
    )
    return user


def find_admin_organization(admin_email: str) -> Optional[Organization]:
    """Organization where the given email has an active ADMIN membership."""
    admin_email = normalize_email(admin_email)
    membership = (
        Membership.objects.filter(
            user__email__iexact=admin_email,
            role=Membership.Role.ADMIN,
            is_active=True,
            organization__is_active=True,
            user__is_active=True,
        )
        .select_related("organization", "user")
        .first()
    )
    return membership.organization if membership else None


def create_staff_invite_token() -> str:
    return secrets.token_urlsafe(32)


def build_staff_invite_url(token: str) -> str:
    frontend = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return f"{frontend}/signup?invite={token}"


def get_valid_staff_invite(token: str) -> Optional[StaffInvite]:
    """Return invite if token is valid, active, unused, and not expired."""
    if not token or not token.strip():
        return None
    invite = (
        StaffInvite.objects.filter(
            token=token.strip(),
            is_active=True,
            used_at__isnull=True,
            organization__is_active=True,
        )
        .select_related("organization")
        .first()
    )
    if not invite:
        return None
    if invite.expires_at <= timezone.now():
        return None
    return invite


def default_invite_expiry(days: int = 7):
    return timezone.now() + timedelta(days=days)


def issue_password_reset(user: User) -> None:
    """Send password reset email (console backend in dev when SMTP unset)."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    frontend = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
    reset_url = f"{frontend}/reset-password?uid={uid}&token={token}"

    subject = "Reset your Quake password"
    message = (
        f"Hello,\n\n"
        f"We received a request to reset the password for {user.email}.\n\n"
        f"Open this link to choose a new password (valid for a limited time):\n"
        f"{reset_url}\n\n"
        f"If you did not request this, you can ignore this email.\n\n"
        f"— Quake Inventory"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def password_reset_dev_hint() -> bool:
    return bool(getattr(settings, "DEBUG", False)) and not getattr(
        settings, "EMAIL_HOST", ""
    )
