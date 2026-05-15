# @maintained quake-inventory-system
# Generated manually for staff invite links

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0004_seed_organization_memberships"),
    ]

    operations = [
        migrations.CreateModel(
            name="StaffInvite",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("token", models.CharField(db_index=True, max_length=64, unique=True)),
                (
                    "email",
                    models.EmailField(
                        blank=True,
                        default="",
                        help_text="When set, only this email may redeem the invite.",
                        max_length=254,
                    ),
                ),
                ("expires_at", models.DateTimeField()),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="staff_invites_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="staff_invites",
                        to="users.organization",
                    ),
                ),
                (
                    "used_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="staff_invites_redeemed",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "users_staff_invite",
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(
                        fields=["organization", "is_active"],
                        name="users_staff_org_active_idx",
                    ),
                ],
            },
        ),
    ]
