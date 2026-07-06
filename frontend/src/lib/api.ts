import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import {
  clearTokens,
  getAccessToken,
  getApiBaseUrl,
  getRefreshToken,
  setTokens,
} from "./auth";
import type {
  AnnotationImage,
  AuthTokens,
  PaginatedResponse,
  Shape,
  Tag,
  Task,
  TaskInput,
  User,
} from "./types";

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && original && !original._retry) {
      if (original.url?.includes("/api/auth/login") || original.url?.includes("/api/auth/refresh")) {
        return Promise.reject(error);
      }

      const refresh = getRefreshToken();
      if (!refresh) {
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (!token) {
              reject(error);
              return;
            }
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<AuthTokens>(
          `${getApiBaseUrl()}/api/auth/refresh/`,
          { refresh },
        );
        setTokens(data.access, data.refresh ?? refresh);
        processQueue(data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        clearTokens();
        processQueue(null);
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Auth
export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/api/auth/login/", { email, password });
  setTokens(data.access, data.refresh);
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/api/auth/me/");
  return data;
}

export function logout(): void {
  clearTokens();
}

async function fetchAllPages<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<T[]> {
  const results: T[] = [];
  let nextPath: string | null = path;
  let queryParams: Record<string, unknown> | undefined = params;

  while (nextPath !== null) {
    const currentPath: string = nextPath;
    nextPath = null;

    const { data: pageData } = await api.get<PaginatedResponse<T> | T[]>(currentPath, {
      params: queryParams,
    });
    queryParams = undefined;

    if (Array.isArray(pageData)) {
      return pageData;
    }

    results.push(...pageData.results);
    if (pageData.next) {
      const next = new URL(pageData.next, getApiBaseUrl());
      nextPath = next.pathname + next.search;
    }
  }

  return results;
}

// Tasks
export async function fetchTasks(date: string): Promise<Task[]> {
  return fetchAllPages<Task>("/api/tasks/", { date });
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data } = await api.post<Task>("/api/tasks/", input);
  return data;
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  const { data } = await api.patch<Task>(`/api/tasks/${id}/`, input);
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/api/tasks/${id}/`);
}

export async function fetchTags(): Promise<Tag[]> {
  return fetchAllPages<Tag>("/api/tags/");
}

export async function createTag(name: string): Promise<Tag> {
  const { data } = await api.post<Tag>("/api/tags/", { name });
  return data;
}

// Annotations
export async function fetchImages(): Promise<AnnotationImage[]> {
  return fetchAllPages<AnnotationImage>("/api/annotations/images/");
}

export async function uploadImage(file: File): Promise<AnnotationImage> {
  const form = new FormData();
  form.append("image", file);
  const { data } = await api.post<AnnotationImage>("/api/annotations/images/", form);
  return data;
}

export async function deleteImage(id: string): Promise<void> {
  await api.delete(`/api/annotations/images/${id}/`);
}

export async function fetchShapes(imageId: string): Promise<Shape[]> {
  return fetchAllPages<Shape>(`/api/annotations/images/${imageId}/shapes/`);
}

export async function createShape(
  imageId: string,
  shape: { points: { x: number; y: number }[]; label?: string; color?: string },
): Promise<Shape> {
  const { data } = await api.post<Shape>(`/api/annotations/images/${imageId}/shapes/`, shape);
  return data;
}

export async function deleteShape(shapeId: string): Promise<void> {
  await api.delete(`/api/annotations/shapes/${shapeId}/`);
}

export default api;
