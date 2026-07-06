# TaskManager Annotator

Full-stack task manager with image annotation tooling.

## Local development

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Deploy on Vercel (auto CI/CD)

This repo is connected to Vercel. **Every push to `master`** triggers a production deployment.

| Setting | Value |
|---------|-------|
| Vercel project | `frontend` |
| Root directory | `frontend/` |
| Production URL | https://frontend-eight-beta-71.vercel.app |

### GitHub Actions

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `.github/workflows/frontend-ci.yml` | Changes in `frontend/` | Lint + build check |
| `.github/workflows/backend-ci.yml` | Changes in `backend/` | Django check + migrations |

**CD (deploy):** Frontend deploys via Vercel Git integration. Backend CD can be added later via Render/Railway when you push the backend.

### Required env var (Vercel dashboard)

Set **Project → Settings → Environment Variables**:

- `NEXT_PUBLIC_API_URL` = your backend API URL

### Manual deploy (optional)

```bash
cd frontend
vercel deploy --prod
```
