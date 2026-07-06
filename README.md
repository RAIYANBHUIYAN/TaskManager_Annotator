# TaskManager Annotator

Full-stack task manager with image annotation tooling.

## Deploy on Vercel (auto CI/CD)

This repo is connected to Vercel. **Every push to `master`** triggers a production deployment.

| Setting | Value |
|---------|-------|
| Vercel project | `frontend` |
| Root directory | `frontend/` |
| Production URL | https://frontend-eight-beta-71.vercel.app |

### Required env var (Vercel dashboard)

Set **Project → Settings → Environment Variables**:

- `NEXT_PUBLIC_API_URL` = your backend API URL

### Manual deploy (optional)

```bash
cd frontend
vercel deploy --prod
```
