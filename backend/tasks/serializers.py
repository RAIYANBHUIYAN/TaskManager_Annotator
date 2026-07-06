from rest_framework import serializers

from .models import Tag, Task


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]
        read_only_fields = ["id"]

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Tag name cannot be empty.")
        user = self.context["request"].user
        qs = Tag.objects.filter(user=user, name__iexact=name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A tag with this name already exists.")
        return name


class TaskSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "status",
            "priority",
            "due_date",
            "tags",
            "tag_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_status(self, value):
        if value not in Task.Status.values:
            raise serializers.ValidationError(
                f"Invalid status. Must be one of: {', '.join(Task.Status.values)}"
            )
        return value

    def validate_priority(self, value):
        if value not in Task.Priority.values:
            raise serializers.ValidationError(
                f"Invalid priority. Must be one of: {', '.join(Task.Priority.values)}"
            )
        return value

    def _set_tags(self, task, tag_ids):
        if tag_ids is None:
            return
        tags = Tag.objects.filter(id__in=tag_ids, user=self.context["request"].user)
        if len(tags) != len(set(tag_ids)):
            raise serializers.ValidationError({"tag_ids": "One or more tag IDs are invalid."})
        task.tags.set(tags)

    def create(self, validated_data):
        tag_ids = validated_data.pop("tag_ids", [])
        validated_data["user"] = self.context["request"].user
        task = Task.objects.create(**validated_data)
        self._set_tags(task, tag_ids)
        return task

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop("tag_ids", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tag_ids is not None:
            self._set_tags(instance, tag_ids)
        return instance
