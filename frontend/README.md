# Frontend — TaskFlow

Next.js App Router client for the Task Manager & Image Annotation portfolio app.

## Requirements

- Node.js 24+ (tested with v24.16.0)
- npm 11+

## Setup

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev
```

App runs at `http://localhost:3000`.

### Demo credentials

- Email: `demo@example.com`
- Password: `Demo@1234`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Architecture

- **State:** Zustand (auth + date), React Query (server data)
- **API:** Axios client with JWT refresh (`src/lib/api.ts`)
- **DnD:** `@dnd-kit/core` kanban board
- **Canvas:** `react-konva` freehand pen annotations with highlighted saved regions

## Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g. `http://localhost:8001`) |

## Deployment (Vercel)

Set `NEXT_PUBLIC_API_URL` to your production API URL and add your Vercel domain to backend `CORS_ALLOWED_ORIGINS`.

## Challenges & How I Solved Them

### Canvas coordinate scaling

Polygon points are stored in **original image pixel coordinates**. The canvas applies uniform scale + offset so annotations stay accurate at any display size. Freehand strokes are simplified and saved as closed regions with visible fill overlays in the canvas, sidebar, and thumbnails.

### Drag-and-drop state sync

Optimistic React Query updates with rollback on PATCH failure — UI never silently desyncs from the server.

### JWT refresh without race conditions

Multiple 401s queue behind a single refresh request; failed refresh clears tokens and redirects to login.

### Konva + Next.js App Router

`AnnotationCanvas` is loaded via `next/dynamic` with `ssr: false` to avoid hydration errors.
