from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AnnotationImageViewSet, ShapeDestroyView, ShapeListCreateView

router = DefaultRouter()
router.register("images", AnnotationImageViewSet, basename="annotation-image")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "images/<uuid:image_id>/shapes/",
        ShapeListCreateView.as_view(),
        name="shape-list-create",
    ),
    path(
        "shapes/<uuid:shape_id>/",
        ShapeDestroyView.as_view(),
        name="shape-destroy",
    ),
]
