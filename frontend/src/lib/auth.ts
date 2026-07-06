const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  document.cookie = `${ACCESS_TOKEN_KEY}=${access}; path=/; max-age=1800; SameSite=Lax`;
  document.cookie = `${REFRESH_TOKEN_KEY}=${refresh}; path=/; max-age=604800; SameSite=Lax`;
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
  document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; max-age=0`;
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export function getMediaUrl(path: string, options?: { maxWidth?: number }): string {
  let url: string;
  if (path.startsWith("http")) {
    url = path;
  } else {
    const base = getApiBaseUrl().replace(/\/$/, "");
    url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }

  const maxWidth = options?.maxWidth ?? 0;
  if (
    maxWidth > 0 &&
    url.includes("res.cloudinary.com/") &&
    url.includes("/upload/") &&
    !url.includes("/upload/w_")
  ) {
    url = url.replace("/upload/", `/upload/w_${maxWidth},c_limit,q_auto/`);
  }

  return url;
}
