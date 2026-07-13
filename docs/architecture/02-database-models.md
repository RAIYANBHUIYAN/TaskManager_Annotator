# Database models

Entity-relationship view of the Django PostgreSQL schema (SQLite locally).

```mermaid
erDiagram
  User ||--o{ Task : owns
  User ||--o{ Tag : owns
  User ||--o{ AnnotationImage : owns
  Task }o--o{ Tag : has
  AnnotationImage ||--o{ Shape : contains

  User {
    uuid id PK
    string email UK
    string password
    string first_name
    string last_name
    boolean is_active
    datetime date_joined
  }

  Task {
    uuid id PK
    string title
    string description
    string status
    string priority
    date due_date
    uuid user_id FK
    datetime created_at
    datetime updated_at
  }

  Tag {
    uuid id PK
    string name
    uuid user_id FK
  }

  AnnotationImage {
    uuid id PK
    file image
    datetime uploaded_at
    uuid user_id FK
  }

  Shape {
    uuid id PK
    json points
    string label
    string color
    uuid image_id FK
    datetime created_at
  }
```

## Notes

- All primary keys are UUIDs.
- Every row is scoped to `User` via foreign keys; APIs filter by `request.user`.
- `Shape.points` is JSON: `[{ "x": number, "y": number }, ...]` in original image pixel coordinates.
