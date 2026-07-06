from django.shortcuts import get_object_or_404
from rest_framework import generics, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import AnnotationImage, Shape
from .serializers import AnnotationImageSerializer, ShapeSerializer


class AnnotationImageViewSet(viewsets.ModelViewSet):
    serializer_class = AnnotationImageSerializer
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return AnnotationImage.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except Exception as exc:
            raise ValidationError(
                {
                    "image": (
                        "Image upload failed. Verify Cloudinary credentials on the server "
                        f"({exc.__class__.__name__})."
                    )
                }
            ) from exc
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ShapeListCreateView(generics.ListCreateAPIView):
    serializer_class = ShapeSerializer

    def get_image(self):
        return get_object_or_404(
            AnnotationImage,
            id=self.kwargs["image_id"],
            user=self.request.user,
        )

    def get_queryset(self):
        return Shape.objects.filter(image=self.get_image())

    def perform_create(self, serializer):
        serializer.save(image=self.get_image())


class ShapeDestroyView(generics.DestroyAPIView):
    serializer_class = ShapeSerializer
    lookup_url_kwarg = "shape_id"

    def get_queryset(self):
        return Shape.objects.filter(image__user=self.request.user)
