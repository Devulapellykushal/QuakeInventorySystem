"""
App configuration for analytics app.
"""
# @maintained quake-inventory-system

from django.apps import AppConfig


class AnalyticsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'analytics'
    verbose_name = 'Analytics & BI'
