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
        if len(value) < 2:
            raise serializers.ValidationError("An annotation must have at least 2 points.")
        return value


class AnnotationImageSerializer(serializers.ModelSerializer):
    shape_count = serializers.SerializerMethodField()

    class Meta:
        model = AnnotationImage
        fields = ["id", "image", "uploaded_at", "shape_count"]
        read_only_fields = ["id", "uploaded_at", "shape_count"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            url = instance.image.url
            if url.startswith(("http://", "https://")):
                data["image"] = url
            else:
                request = self.context.get("request")
                if request is not None:
                    data["image"] = request.build_absolute_uri(url)
        return data

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
