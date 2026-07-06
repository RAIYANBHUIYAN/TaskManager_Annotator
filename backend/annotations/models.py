import uuid

from django.conf import settings
from django.db import models


class AnnotationImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="annotation_images",
    )
    image = models.ImageField(upload_to="annotation_images/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"Image {self.id} ({self.user.email})"


class Shape(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    image = models.ForeignKey(
        AnnotationImage,
        on_delete=models.CASCADE,
        related_name="shapes",
    )
    points = models.JSONField(default=list)
    label = models.CharField(max_length=100, blank=True, default="")
    color = models.CharField(max_length=20, blank=True, default="#ef4444")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Shape {self.id} on {self.image_id}"
