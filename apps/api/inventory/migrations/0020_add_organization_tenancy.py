# Add organization FK to tenant-scoped inventory models and backfill default org.

from django.db import migrations, models
import django.db.models.deletion


def get_default_organization(apps):
    Organization = apps.get_model("users", "Organization")
    org, _ = Organization.objects.get_or_create(
        slug="quake",
        defaults={"name": "Quake", "is_active": True},
    )
    return org


def backfill_organization(apps, schema_editor):
    org = get_default_organization(apps)
    org_id = org.id

    for model_name in (
        "Category",
        "ServiceItem",
        "Warehouse",
        "SKUSequence",
        "Product",
        "ProductVariant",
    ):
        Model = apps.get_model("inventory", model_name)
        Model.objects.filter(organization_id__isnull=True).update(organization_id=org_id)


def reverse_backfill(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0005_staffinvite"),
        ("inventory", "0019_warehouse_email_phone_seller_image"),
    ]

    operations = [
        # --- Add nullable organization FKs ---
        migrations.AddField(
            model_name="category",
            name="organization",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="categories",
                to="users.organization",
            ),
        ),
        migrations.AddField(
            model_name="serviceitem",
            name="organization",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="service_items",
                to="users.organization",
            ),
        ),
        migrations.AddField(
            model_name="warehouse",
            name="organization",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="warehouses",
                to="users.organization",
            ),
        ),
        migrations.AddField(
            model_name="skusequence",
            name="organization",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="sku_sequences",
                to="users.organization",
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="organization",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="products",
                to="users.organization",
            ),
        ),
        migrations.AddField(
            model_name="productvariant",
            name="organization",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="product_variants",
                to="users.organization",
            ),
        ),
        migrations.RunPython(backfill_organization, reverse_backfill),
        # --- Make organization required ---
        migrations.AlterField(
            model_name="category",
            name="organization",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="categories",
                to="users.organization",
            ),
        ),
        migrations.AlterField(
            model_name="serviceitem",
            name="organization",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="service_items",
                to="users.organization",
            ),
        ),
        migrations.AlterField(
            model_name="warehouse",
            name="organization",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="warehouses",
                to="users.organization",
            ),
        ),
        migrations.AlterField(
            model_name="skusequence",
            name="organization",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="sku_sequences",
                to="users.organization",
            ),
        ),
        migrations.AlterField(
            model_name="product",
            name="organization",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="products",
                to="users.organization",
            ),
        ),
        migrations.AlterField(
            model_name="productvariant",
            name="organization",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="product_variants",
                to="users.organization",
            ),
        ),
        # --- Drop global uniqueness (replaced by per-org constraints) ---
        migrations.AlterField(
            model_name="category",
            name="name",
            field=models.CharField(max_length=100),
        ),
        migrations.AlterField(
            model_name="warehouse",
            name="name",
            field=models.CharField(max_length=100),
        ),
        migrations.AlterField(
            model_name="warehouse",
            name="code",
            field=models.CharField(max_length=20),
        ),
        migrations.AlterField(
            model_name="product",
            name="sku",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text="Unique product SKU (auto-generated if not provided)",
                max_length=100,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="product",
            name="barcode_value",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text="Code128 barcode value (auto-generated, immutable)",
                max_length=128,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="productvariant",
            name="sku",
            field=models.CharField(max_length=50),
        ),
        migrations.AlterField(
            model_name="productvariant",
            name="barcode",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text="Unique barcode for POS scanning. Auto-generated on creation.",
                max_length=50,
                null=True,
            ),
        ),
        migrations.AlterUniqueTogether(
            name="skusequence",
            unique_together=set(),
        ),
        # --- Per-organization uniqueness ---
        migrations.AddConstraint(
            model_name="category",
            constraint=models.UniqueConstraint(
                fields=("organization", "name"),
                name="inventory_category_org_name_uniq",
            ),
        ),
        migrations.AddConstraint(
            model_name="serviceitem",
            constraint=models.UniqueConstraint(
                fields=("organization", "service_name"),
                name="inventory_serviceitem_org_name_uniq",
            ),
        ),
        migrations.AddConstraint(
            model_name="warehouse",
            constraint=models.UniqueConstraint(
                fields=("organization", "name"),
                name="inventory_warehouse_org_name_uniq",
            ),
        ),
        migrations.AddConstraint(
            model_name="warehouse",
            constraint=models.UniqueConstraint(
                fields=("organization", "code"),
                name="inventory_warehouse_org_code_uniq",
            ),
        ),
        migrations.AddConstraint(
            model_name="skusequence",
            constraint=models.UniqueConstraint(
                fields=("organization", "brand", "category"),
                name="inventory_skuseq_org_brand_category_uniq",
            ),
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.UniqueConstraint(
                condition=models.Q(sku__isnull=False) & ~models.Q(sku=""),
                fields=("organization", "sku"),
                name="inventory_product_org_sku_uniq",
            ),
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.UniqueConstraint(
                condition=models.Q(barcode_value__isnull=False)
                & ~models.Q(barcode_value=""),
                fields=("organization", "barcode_value"),
                name="inventory_product_org_barcode_uniq",
            ),
        ),
        migrations.AddConstraint(
            model_name="productvariant",
            constraint=models.UniqueConstraint(
                fields=("organization", "sku"),
                name="inventory_productvariant_org_sku_uniq",
            ),
        ),
        migrations.AddConstraint(
            model_name="productvariant",
            constraint=models.UniqueConstraint(
                condition=models.Q(barcode__isnull=False) & ~models.Q(barcode=""),
                fields=("organization", "barcode"),
                name="inventory_productvariant_org_barcode_uniq",
            ),
        ),
    ]
