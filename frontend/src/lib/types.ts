export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RegisterResponse extends AuthTokens {
  user: User;
}

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Tag {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date: string;
  tag_ids?: string[];
}

export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  points: Point[];
  label: string;
  color: string;
  created_at: string;
}

export interface AnnotationImage {
  id: string;
  image: string;
  uploaded_at: string;
  shape_count: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-emerald-100 text-emerald-700" },
  { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-700" },
  { value: "high", label: "High", color: "bg-rose-100 text-rose-700" },
];

export const DEFAULT_SHAPE_COLOR = "#ef4444";
