from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("api/health/", health, name="health"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("tasks.urls")),
    path("api/annotations/", include("annotations.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # Portfolio note: Render free tier disk is ephemeral — uploads may not persist across redeploys.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
