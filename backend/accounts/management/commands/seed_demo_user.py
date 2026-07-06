from datetime import date

from django.core.management.base import BaseCommand

from accounts.models import User
from tasks.models import Tag, Task


class Command(BaseCommand):
    help = "Create a demo user for recruiters (demo@example.com / Demo@1234)"

    def handle(self, *args, **options):
        email = "demo@example.com"
        password = "Demo@1234"

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"first_name": "Demo", "last_name": "User"},
        )
        user.set_password(password)
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created demo user: {email}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Updated demo user password: {email}"))

        today = date.today()
        tag_names = ["Frontend", "Backend", "Design"]
        tags = []
        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(user=user, name=name)
            tags.append(tag)

        if not Task.objects.filter(user=user).exists():
            demo_tasks = [
                {
                    "title": "Review pull requests",
                    "description": "Check open PRs on the annotation feature branch",
                    "status": Task.Status.TODO,
                    "priority": Task.Priority.HIGH,
                    "due_date": today,
                    "tags": [tags[1]],
                },
                {
                    "title": "Polish login UI",
                    "description": "Improve form validation messages and loading states",
                    "status": Task.Status.IN_PROGRESS,
                    "priority": Task.Priority.MEDIUM,
                    "due_date": today,
                    "tags": [tags[0], tags[2]],
                },
                {
                    "title": "Write README challenges section",
                    "description": "Document coordinate scaling and JWT refresh decisions",
                    "status": Task.Status.DONE,
                    "priority": Task.Priority.LOW,
                    "due_date": today,
                    "tags": [tags[0]],
                },
            ]
            for data in demo_tasks:
                task_tags = data.pop("tags")
                task = Task.objects.create(user=user, **data)
                task.tags.set(task_tags)
            self.stdout.write(self.style.SUCCESS(f"Created {len(demo_tasks)} demo tasks for today"))
