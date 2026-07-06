from django.shortcuts import get_object_or_404
from rest_framework import generics, viewsets
from rest_framework.parsers import FormParser, MultiPartParser

from .models import AnnotationImage, Shape
from .serializers import AnnotationImageSerializer, ShapeSerializer


class AnnotationImageViewSet(viewsets.ModelViewSet):
    serializer_class = AnnotationImageSerializer
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return AnnotationImage.objects.filter(user=self.request.user)

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
