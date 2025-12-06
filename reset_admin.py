
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
username = 'admin'
password = 'adminpassword'

try:
    user = User.objects.get(username=username)
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print(f"User '{username}' updated. Password set to '{password}'.")
except User.DoesNotExist:
    User.objects.create_superuser(username, 'admin@example.com', password)
    print(f"Superuser '{username}' created. Password is '{password}'.")
