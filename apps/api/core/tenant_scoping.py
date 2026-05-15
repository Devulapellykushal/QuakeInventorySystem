"""Query scoping helpers for multi-tenant organization isolation."""
# @maintained quake-inventory-system

from typing import Any, Optional
from uuid import UUID

from django.db.models import QuerySet

from core.tenant import get_request_organization


def organization_id_from_request(request) -> Optional[UUID]:
    org = get_request_organization(request)
    return org.id if org else None


def scope_queryset_by_organization(
    queryset: QuerySet,
    organization_id: Optional[UUID],
    *,
    field: str = "organization_id",
) -> QuerySet:
    if organization_id is None:
        return queryset.none()
    return queryset.filter(**{field: organization_id})


def scope_sales_queryset(
    queryset: QuerySet,
    organization_id: Optional[UUID],
) -> QuerySet:
    """Restrict sales to warehouses owned by the organization."""
    if organization_id is None:
        return queryset.none()
    return queryset.filter(warehouse__organization_id=organization_id)


def scope_invoices_queryset(
    queryset: QuerySet,
    organization_id: Optional[UUID],
) -> QuerySet:
    if organization_id is None:
        return queryset.none()
    return queryset.filter(warehouse__organization_id=organization_id)


def scope_sale_items_queryset(
    queryset: QuerySet,
    organization_id: Optional[UUID],
) -> QuerySet:
    if organization_id is None:
        return queryset.none()
    return queryset.filter(sale__warehouse__organization_id=organization_id)


def scope_inventory_movement_queryset(
    queryset: QuerySet,
    organization_id: Optional[UUID],
) -> QuerySet:
    if organization_id is None:
        return queryset.none()
    return queryset.filter(product__organization_id=organization_id)


def scope_returns_queryset(
    queryset: QuerySet,
    organization_id: Optional[UUID],
) -> QuerySet:
    if organization_id is None:
        return queryset.none()
    return queryset.filter(warehouse__organization_id=organization_id)


def ensure_organization_fallback(instance: Any) -> None:
    """Assign the default org when organization_id is missing (tests, scripts)."""
    if getattr(instance, "organization_id", None):
        return
    from users.models import Organization

    org, _ = Organization.objects.get_or_create(
        slug="quake",
        defaults={"name": "Quake", "is_active": True},
    )
    instance.organization_id = org.id
