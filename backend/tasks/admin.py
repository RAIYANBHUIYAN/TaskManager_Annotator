from django.contrib import admin

from .models import Tag, Task


class TaskAdmin(admin.ModelAdmin):
    list_display = ["title", "status", "priority", "due_date", "user"]
    list_filter = ["status", "priority", "due_date"]
    search_fields = ["title", "description"]
    filter_horizontal = ["tags"]


class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "user"]
    search_fields = ["name"]


admin.site.register(Task, TaskAdmin)
admin.site.register(Tag, TagAdmin)
