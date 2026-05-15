# @maintained quake-inventory-system
# Backfill default org and memberships; admin demo account gets ADMIN + STAFF.

from django.db import migrations


def seed_organization_memberships(apps, schema_editor):
    Organization = apps.get_model("users", "Organization")
    Membership = apps.get_model("users", "Membership")
    User = apps.get_model("users", "User")

    org, _ = Organization.objects.get_or_create(
        slug="quake",
        defaults={"name": "Quake", "is_active": True},
    )

    for user in User.objects.all():
        Membership.objects.update_or_create(
            user=user,
            organization=org,
            role=user.role,
            defaults={"is_active": True},
        )

    # Demo admin can sign in as Administrator or Staff (same email, two memberships).
    admin = User.objects.filter(email__iexact="admin@Quake.com").first()
    if admin:
        Membership.objects.update_or_create(
            user=admin,
            organization=org,
            role="STAFF",
            defaults={"is_active": True},
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_organization_membership"),
    ]

    operations = [
        migrations.RunPython(seed_organization_memberships, noop_reverse),
    ]
