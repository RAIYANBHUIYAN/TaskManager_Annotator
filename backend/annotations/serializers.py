from rest_framework import serializers

from .models import AnnotationImage, Shape

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


class PointSerializer(serializers.Serializer):
    x = serializers.FloatField()
    y = serializers.FloatField()


class ShapeSerializer(serializers.ModelSerializer):
    points = PointSerializer(many=True)

    class Meta:
        model = Shape
        fields = ["id", "points", "label", "color", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_points(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("A polygon must have at least 3 points.")
        return value


class AnnotationImageSerializer(serializers.ModelSerializer):
    shape_count = serializers.SerializerMethodField()

    class Meta:
        model = AnnotationImage
        fields = ["id", "image", "uploaded_at", "shape_count"]
        read_only_fields = ["id", "uploaded_at", "shape_count"]

    def get_shape_count(self, obj):
        return obj.shapes.count()

    def validate_image(self, value):
        if value.size > MAX_IMAGE_SIZE:
            raise serializers.ValidationError("Image must be under 10 MB.")
        content_type = getattr(value, "content_type", None)
        if content_type and content_type not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError(
                "Unsupported format. Use JPEG, PNG, GIF, or WebP."
            )
        return value
