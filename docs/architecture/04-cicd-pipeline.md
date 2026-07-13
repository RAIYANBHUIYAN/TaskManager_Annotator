# CI/CD pipeline

Git push to `master` triggers GitHub Actions checks and automatic deploys to Vercel and Render.

```mermaid
flowchart LR
  Dev[Developer] -->|git push master| GitHub[GitHub repo]

  GitHub --> GHA[GitHub Actions]
  GitHub --> Vercel[Vercel auto-deploy]
  GitHub --> Render[Render auto-deploy]

  GHA --> FE_CI[frontend-ci.yml<br/>ESLint + build]
  GHA --> BE_CI[backend-ci.yml<br/>Django check + migrate]

  Vercel --> FE_Live[frontend-eight-beta-71.vercel.app]
  Render --> API_Live[taskflow-api-ub80.onrender.com]
  Render --> DB[(taskflow-db PostgreSQL)]
```

## Workflows

| File | Trigger | Checks |
|------|---------|--------|
| `.github/workflows/frontend-ci.yml` | Changes in `frontend/` | `npm run lint`, `npm run build` |
| `.github/workflows/backend-ci.yml` | Changes in `backend/` | `manage.py check`, `migrate --noinput` |

## Deploy config

| App | Platform | Config |
|-----|----------|--------|
| Frontend | Vercel | Root dir: `frontend/` |
| Backend | Render | `render.yaml` + `backend/build.sh` |
