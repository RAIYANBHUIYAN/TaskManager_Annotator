# State management (two layers)

Frontend separates **client UI state** (Zustand) from **server data** (React Query).

```mermaid
flowchart LR
  subgraph zustand [Zustand - Client UI State]
    Auth[authStore<br/>user session]
    Date[dateStore<br/>selected calendar date]
  end

  subgraph reactquery [React Query - Server State]
    Tasks[tasks query]
    Tags[tags query]
    Images[annotation-images query]
    Shapes[shapes query]
  end

  subgraph pages [Pages and components]
    TasksPage[/tasks Board]
    AnnotatePage[/annotate canvas]
    LoginPage[/login]
  end

  subgraph api [Axios api.ts]
    HTTP[HTTP client<br/>JWT interceptors<br/>refresh queue]
  end

  Auth --> LoginPage
  Date --> TasksPage
  Tasks --> TasksPage
  Tags --> TasksPage
  Images --> AnnotatePage
  Shapes --> AnnotatePage

  Tasks --> HTTP
  Tags --> HTTP
  Images --> HTTP
  Shapes --> HTTP
  Auth --> HTTP
```

## Zustand (client)

| Store | File | Holds |
|-------|------|--------|
| `authStore` | `frontend/src/store/authStore.ts` | Current user, `loadUser()`, logout |
| `dateStore` | `frontend/src/store/dateStore.ts` | Selected date for the Kanban board |

## React Query (server)

| Query key | Used for |
|-----------|----------|
| `["tasks", date]` | Tasks for a due date |
| `["tags"]` | Tag list in task modal |
| `["annotation-images"]` | Uploaded images |
| `["shapes", imageId]` | Annotations on one image |

Tokens live in `localStorage` + cookies (see `frontend/src/lib/auth.ts`).
