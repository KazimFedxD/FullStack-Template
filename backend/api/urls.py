from django.urls import path, include
from .views import (
    contact,
    is_admin,
    patches_detail,
    patches_list,
    sitemap_xml,
)

urlpatterns = [
    path("sitemap.xml", sitemap_xml, name="sitemap_xml"),
    path("patches/", patches_list, name="patches_list"),
    path("patches/<str:version>/", patches_detail, name="patches_detail"),
    # App endpoints
    path("auth/", include("usermanagement.urls")),
    path("adminpanel/", include("adminpanel.urls")),
    path("admin/", include("adminpanel.urls")),
    path("contact/", contact, name="contact"),
    path("session/", include("sessions.urls")),
    path("enterprise/", include("enterprise.urls")),
    path("profile/", include("profiles.urls")),
    path("billing/", include("billing.urls")),
    # API endpoints
    path("is_admin/", is_admin, name="is_admin"),
]
