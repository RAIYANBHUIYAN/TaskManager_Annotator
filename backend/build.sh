#!/usr/bin/env bash
# Render build script — runs on every deploy
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate --noinput
python manage.py seed_demo_user
python manage.py seed_admin_user
