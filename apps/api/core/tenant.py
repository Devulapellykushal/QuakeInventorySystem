"""Helpers for multi-tenant organization context on requests."""
# @maintained quake-inventory-system


def get_request_organization(request):
    """Return the active Organization for this request, or None."""
    return getattr(request, "organization", None)


def get_request_org_role(request):
    """Return the caller's role in the active org (ADMIN | STAFF), or None."""
    return getattr(request, "org_role", None)
