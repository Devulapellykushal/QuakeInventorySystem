"""View mixins for organization-scoped inventory APIs."""
# @maintained quake-inventory-system

from core.tenant_scoping import organization_id_from_request, scope_queryset_by_organization


class OrganizationScopedMixin:
    """Filter list/detail querysets to the request's active organization."""

    organization_field = "organization_id"

    def get_queryset(self):
        queryset = super().get_queryset()
        org_id = organization_id_from_request(self.request)
        return scope_queryset_by_organization(
            queryset, org_id, field=self.organization_field
        )

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied

        org = getattr(self.request, "organization", None)
        if org is None:
            raise PermissionDenied("Organization context is required.")
        serializer.save(organization=org)
