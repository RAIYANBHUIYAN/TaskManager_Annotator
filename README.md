# TaskManager Annotator (TaskFlow)

Full-stack portfolio app: **Kanban task manager** + **freehand image annotation** for labeling regions on medical or general images.

**Repository:** [RAIYANBHUIYAN/TaskManager_Annotator](https://github.com/RAIYANBHUIYAN/TaskManager_Annotator)

---

## Live demo

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** (Vercel) | https://frontend-eight-beta-71.vercel.app | ✅ Deployed |
| **Backend API** (Render) | https://taskflow-api-ub80.onrender.com | ✅ Deployed |
| **Health check** | https://taskflow-api-ub80.onrender.com/api/health/ | ✅ |

### Demo login

- **Email:** `demo@example.com`
- **Password:** `Demo@1234`

> **Note:** Render free tier cold-starts after idle time — the first API request may take 30–60 seconds.

---

## Current project status

### ✅ Complete & working

- **Authentication** — Email + JWT (login, refresh, protected routes)
- **Tasks** — Kanban board with drag-and-drop, date filter, tags, priorities, due dates
- **Image upload** — Cloudinary storage in production (persistent across redeploys)
- **Annotation tool** — Smooth pen-style freehand drawing with highlighted saved regions
- **Saved region previews** — Visible on canvas, sidebar list, and image strip thumbnails
- **CI/CD** — GitHub Actions (lint/build) + Vercel auto-deploy + Render Blueprint

### 🏗 Architecture

```
frontend/          Next.js 16 · React 19 · TypeScript · Tailwind · Zustand · React Query · Konva
backend/           Django 5.2 · DRF · JWT · PostgreSQL (prod) · SQLite (local)
render.yaml        Render Blueprint (PostgreSQL + web service)
```

### 📁 Monorepo layout

```
TaskManager_Annotator/
├── frontend/          Next.js app (Vercel root: frontend/)
├── backend/           Django API (Render root: backend/)
├── render.yaml        One-click Render deploy config
├── .github/workflows/ frontend-ci.yml · backend-ci.yml
└── README.md
```

---

## Features

### Task manager (`/tasks`)

- Kanban columns: To Do · In Progress · Done
- Drag-and-drop status changes with optimistic UI + rollback on failure
- Filter tasks by date
- Create/edit tasks with tags, priority, and due date

### Image annotation (`/annotate`)

- Upload images (stored on **Cloudinary** in production)
- **Pen-style drawing** — click and drag to outline a region, release to save
- Highlighted regions with fill + stroke on the canvas
- **Saved regions** panel with mini previews
- Thumbnails in the image strip show annotation overlays
- Select / delete annotations (Delete key or button)

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, TanStack Query, Axios, react-konva, @dnd-kit |
| Backend | Django 5.2, Django REST Framework, SimpleJWT, django-cors-headers, django-filter, Pillow |
| Database | PostgreSQL (Render) · SQLite (local dev) |
| Media | Cloudinary (production) · local `media/` (dev without Cloudinary) |
| Hosting | Vercel (frontend) · Render (API + Postgres) |
| CI | GitHub Actions |

---

## Local development

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
cp .env.example .env             # optional: Cloudinary keys for image upload
python manage.py migrate
python manage.py seed_demo_user
python manage.py runserver 8001
```

API: `http://localhost:8001`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

App: `http://localhost:3000`

**`frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## Deployment

### Frontend — Vercel

Auto-deploys on every push to `master`.

| Setting | Value |
|---------|-------|
| Root directory | `frontend/` |
| Production URL | https://frontend-eight-beta-71.vercel.app |

**Required env var (Vercel → Settings → Environment Variables):**

```env
NEXT_PUBLIC_API_URL=https://taskflow-api-ub80.onrender.com
```

### Backend — Render

Deployed via [Render Blueprint](https://render.com/docs/blueprint-spec) (`render.yaml`).

| Resource | Name |
|----------|------|
| Web service | `taskflow-api` |
| PostgreSQL | `taskflow-db` |

**Required env vars on Render (`taskflow-api`):**

```env
CORS_ALLOWED_ORIGINS=https://frontend-eight-beta-71.vercel.app
CSRF_TRUSTED_ORIGINS=https://frontend-eight-beta-71.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

`DATABASE_URL` and `SECRET_KEY` are set automatically by the Blueprint.

---

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/` | Health check |
| POST | `/api/auth/login/` | JWT login |
| POST | `/api/auth/refresh/` | Refresh token |
| GET | `/api/auth/me/` | Current user |
| GET/POST | `/api/tasks/?date=YYYY-MM-DD` | Tasks for a date |
| PATCH/DELETE | `/api/tasks/:id/` | Update/delete task |
| GET/POST | `/api/tags/` | Tags |
| GET/POST | `/api/annotations/images/` | List/upload images |
| DELETE | `/api/annotations/images/:id/` | Delete image |
| GET/POST | `/api/annotations/images/:id/shapes/` | List/create annotations |
| DELETE | `/api/annotations/shapes/:id/` | Delete annotation |

All task and annotation routes require `Authorization: Bearer <access_token>`.

---

## CI/CD (GitHub Actions)

| Workflow | Trigger | Checks |
|----------|---------|--------|
| `frontend-ci.yml` | Changes in `frontend/` | ESLint + production build |
| `backend-ci.yml` | Changes in `backend/` | Django system check + migrations |

---

## Recent milestones

- Render backend deployed with PostgreSQL + Cloudinary
- Vercel frontend connected to live API
- Polygon annotation replaced with smooth pen-style freehand drawing
- Saved region highlights visible on canvas, sidebar, and thumbnails
- Production fixes: collectstatic/Cloudinary, CORS, paginated shapes API, Konva on Vercel

---

## Author

**Raiyan Bhuiyan** — [GitHub](https://github.com/RAIYANBHUIYAN)
