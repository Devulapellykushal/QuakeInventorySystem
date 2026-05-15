"""DRF view mixins shared across apps."""
# @maintained quake-inventory-system


class OrganizationFilterMixin:
    """
    Restrict queryset to request.organization.

    Requires OrganizationJWTAuthentication (or any auth that sets
    request.organization). Subclasses may set organization_lookup to follow
    a relation, e.g. organization_lookup = "warehouse__organization".
    """

    organization_lookup = "organization"

    def get_queryset(self):
        qs = super().get_queryset()
        org = getattr(self.request, "organization", None)
        if org is None:
            return qs.none()
        return qs.filter(**{self.organization_lookup: org})
