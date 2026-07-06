import django_filters
from rest_framework import viewsets

from .models import Tag, Task
from .serializers import TagSerializer, TaskSerializer


class TaskFilter(django_filters.FilterSet):
    date = django_filters.DateFilter(field_name="due_date", lookup_expr="exact")

    class Meta:
        model = Task
        fields = ["date", "status", "priority"]


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    filterset_class = TaskFilter

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).prefetch_related("tags")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
