"""Unique usernames for Django tests (avoids collisions under SQLite + APITestCase)."""
# @maintained quake-inventory-system
import uuid


def unique_username(prefix: str = "user") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"
