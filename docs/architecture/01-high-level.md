# High-level architecture

TaskFlow: browser UI on Vercel, Django API + PostgreSQL on Render, images on Cloudinary.

```mermaid
flowchart TB
  subgraph client [Browser]
    UI[Next.js Frontend]
  end

  subgraph vercel [Vercel]
    FE[Static + SSR Shell]
  end

  subgraph render [Render]
    API[Django REST API]
    PG[(PostgreSQL)]
  end

  subgraph cloudinary [Cloudinary]
    CDN[Image CDN]
  end

  UI --> FE
  FE -->|HTTPS + JWT| API
  API --> PG
  API -->|upload/read| CDN
```

## Live endpoints

| Service | URL |
|---------|-----|
| Frontend | https://frontend-eight-beta-71.vercel.app |
| Backend API | https://taskflow-api-ub80.onrender.com |
| Health check | https://taskflow-api-ub80.onrender.com/api/health/ |
