from django.contrib import admin

from .models import AnnotationImage, Shape


class ShapeInline(admin.TabularInline):
    model = Shape
    extra = 0


@admin.register(AnnotationImage)
class AnnotationImageAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "uploaded_at"]
    list_filter = ["uploaded_at"]
    inlines = [ShapeInline]


@admin.register(Shape)
class ShapeAdmin(admin.ModelAdmin):
    list_display = ["id", "image", "label", "color", "created_at"]
    list_filter = ["created_at"]
