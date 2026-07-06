# Backend — Task Manager & Image Annotation API

Django REST API for the full-stack portfolio application.

## Requirements

- Python 3.11+ (tested with 3.11.9)
- pip

## Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # edit SECRET_KEY for production
python manage.py migrate
python manage.py seed_demo_user
python manage.py runserver
```

API runs at `http://localhost:8000`.

### Demo credentials

- Email: `demo@example.com`
- Password: `Demo@1234`

The seed command also creates sample tags and tasks for today's date.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | — | Django secret key |
| `DEBUG` | `True` | Debug mode |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated hosts |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Frontend origin(s) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | JWT login (`email` + `password`) |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Current user |
| GET/POST | `/api/tasks/` | List/create tasks (`?date=YYYY-MM-DD`) |
| PATCH/DELETE | `/api/tasks/:id/` | Update/delete task |
| GET/POST | `/api/tags/` | List/create tags |
| GET/POST | `/api/annotations/images/` | List/upload images (multipart) |
| DELETE | `/api/annotations/images/:id/` | Delete image |
| GET/POST | `/api/annotations/images/:id/shapes/` | List/create shapes |
| DELETE | `/api/annotations/shapes/:id/` | Delete shape |

All task and annotation endpoints require `Authorization: Bearer <access_token>`.

## Admin

```bash
python manage.py createsuperuser
```

Visit `http://localhost:8000/admin/` to inspect Users, Tasks, Tags, Images, and Shapes.

## Challenges & How I Solved Them

### Email-based JWT login with custom User model

`djangorestframework-simplejwt` defaults to a `username` field. The custom `User` model uses `email` as `USERNAME_FIELD`, so `EmailTokenObtainPairSerializer` sets `username_field = "email"` to accept `{ "email": "...", "password": "..." }` in the login body.

### Per-user data scoping

All ViewSets override `get_queryset()` to filter by `request.user`. Serializers assign `user` in `perform_create` so clients cannot attach data to another account.

### Date filtering for tasks

A `django-filter` `FilterSet` exposes `?date=YYYY-MM-DD` mapped to `due_date__exact`, keeping the query param clean while the model field stays indexed.

### Media uploads in dev

`MEDIA_ROOT` and `MEDIA_URL` are configured, and `core/urls.py` serves media files when `DEBUG=True` so the frontend can load uploaded annotation images directly.

## Deploy on Render

The repo includes `render.yaml` (Blueprint) at the root for one-click deploy with **PostgreSQL**.

### Option A — Blueprint (recommended)

1. Push this repo to GitHub.
2. Go to [Render Dashboard → Blueprints](https://dashboard.render.com/blueprints) → **New Blueprint Instance**.
3. Connect `RAIYANBHUIYAN/TaskManager_Annotator`.
4. Set these env vars when prompted:
   - `CORS_ALLOWED_ORIGINS` = `https://frontend-eight-beta-71.vercel.app`
   - `CSRF_TRUSTED_ORIGINS` = `https://frontend-eight-beta-71.vercel.app`
5. Deploy. Render creates a **Web Service** + **PostgreSQL** database.

### Option B — Manual Web Service

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `./build.sh` |
| Start Command | `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT` |
| Health Check | `/api/health/` |

Link a Render PostgreSQL instance and set `DATABASE_URL` automatically.

### After deploy

1. Copy your Render URL (e.g. `https://taskflow-api.onrender.com`).
2. In **Vercel** → set `NEXT_PUBLIC_API_URL` to that URL.
3. Redeploy the frontend.

### Local vs production database

| Environment | Database |
|-------------|----------|
| Local dev | SQLite (`db.sqlite3`) — no install needed |
| Render | PostgreSQL via `DATABASE_URL` |

### Media uploads on Render

Annotation image uploads use local disk on Render. On the **free tier**, files may be **lost on redeploy**. For production, migrate to S3/Cloudinary later.

## Deployment (general)
