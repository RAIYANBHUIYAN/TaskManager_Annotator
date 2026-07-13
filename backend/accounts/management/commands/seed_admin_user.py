from django.core.management.base import BaseCommand

from accounts.constants import ADMIN_EMAIL, ADMIN_USERNAME
from accounts.models import User


class Command(BaseCommand):
    help = f"Create admin user ({ADMIN_USERNAME} / admin@lex)"

    def handle(self, *args, **options):
        password = "admin@lex"

        user, created = User.objects.get_or_create(
            email=ADMIN_EMAIL,
            defaults={
                "first_name": "Lex",
                "last_name": "Admin",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created admin user: {ADMIN_USERNAME}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Updated admin user: {ADMIN_USERNAME}"))
