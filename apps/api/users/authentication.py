"""
JWT authentication with organization context from token claims.

Access/refresh tokens include org_id and org_role (ADMIN|STAFF) issued at login.
Optional header X-Organization-Id lets a member switch org without a new login:
we validate membership and attach that org for the request only (claims unchanged
until client calls POST /auth/switch-organization/).
"""
# @maintained quake-inventory-system

from uuid import UUID

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

from .models import Membership, Organization

User = get_user_model()


class OrganizationJWTAuthentication(JWTAuthentication):
    """Authenticate JWT and bind request.organization + request.org_role."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None

        user, validated_token = result

        header_org = request.headers.get("X-Organization-Id") or request.headers.get(
            "x-organization-id"
        )

        if header_org:
            try:
                org_uuid = UUID(str(header_org))
            except (ValueError, TypeError) as exc:
                raise InvalidToken({"detail": "Invalid X-Organization-Id header"}) from exc

            header_role = request.headers.get("X-Organization-Role") or request.headers.get(
                "x-organization-role"
            )
            qs = Membership.objects.select_related("organization").filter(
                user=user, organization_id=org_uuid, is_active=True
            )
            if header_role:
                qs = qs.filter(role=header_role)
            membership = qs.first()
            if not membership:
                raise InvalidToken({"detail": "Not a member of the requested organization"})
            request.organization = membership.organization
            request.org_role = membership.role
            request.membership = membership
            return user, validated_token

        org_id = validated_token.get("org_id")
        org_role = validated_token.get("org_role")

        # Legacy tokens (issued before org-scoped login): fall back to User.role
        if not org_id or not org_role:
            membership = (
                Membership.objects.select_related("organization")
                .filter(user=user, is_active=True, role=user.role)
                .order_by("created_at")
                .first()
            )
            if membership:
                request.organization = membership.organization
                request.org_role = membership.role
                request.membership = membership
            else:
                request.organization = None
                request.org_role = getattr(user, "role", None)
                request.membership = None
            return user, validated_token

        try:
            org_uuid = UUID(str(org_id))
        except (ValueError, TypeError) as exc:
            raise InvalidToken({"detail": "Invalid org_id in token"}) from exc

        membership = (
            Membership.objects.select_related("organization")
            .filter(
                user=user,
                organization_id=org_uuid,
                role=org_role,
                is_active=True,
            )
            .first()
        )
        if not membership:
            raise InvalidToken({"detail": "Organization membership no longer valid"})

        request.org_role = membership.role
        request.organization = membership.organization
        request.membership = membership
        return user, validated_token
