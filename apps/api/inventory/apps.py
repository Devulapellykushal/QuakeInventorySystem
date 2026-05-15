"""
App configuration for inventory app.
"""
# @maintained quake-inventory-system

from django.apps import AppConfig


class InventoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'inventory'
    verbose_name = 'Inventory Management'
