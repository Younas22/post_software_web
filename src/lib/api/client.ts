import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiCollection, ApiError, ApiSuccess } from "./types";

const TOKEN_KEY = "pos_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost/post_software/api/v1";

export const http = axios.create({
  baseURL,
  headers: { Accept: "application/json" },
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * A single place to react to a session having gone bad — set by
 * AuthProvider on mount so this module (which the auth context itself
 * depends on) never has to import React/router code directly.
 */
let onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(toApiClientError(error));
  }
);

/** Normalized client-side error shape every service call throws. */
export class ApiClientError extends Error {
  status: number | null;
  errors: Record<string, string[]>;

  constructor(message: string, status: number | null, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }

  /** First validation message for a field, if any — handy in forms. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0];
  }
}

function toApiClientError(error: AxiosError<ApiError>): ApiClientError {
  if (error.response) {
    const body = error.response.data;
    const message =
      body?.message ||
      (error.response.status >= 500
        ? "Something went wrong on our end. Please try again."
        : "Request failed.");
    return new ApiClientError(message, error.response.status, (body?.errors as Record<string, string[]>) ?? {});
  }
  if (error.request) {
    return new ApiClientError("Unable to reach the server. Check your connection and try again.", null);
  }
  return new ApiClientError(error.message || "Unexpected error.", null);
}

/** GET expecting a single-resource envelope; returns the unwrapped `data`. */
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.get<ApiSuccess<T>>(url, config);
  return data.data;
}

/** GET expecting a collection/paginated envelope; returns `data` + `meta`. */
export async function apiGetList<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<{ data: T[]; meta: ApiCollection<T>["meta"] }> {
  const { data } = await http.get<ApiCollection<T>>(url, config);
  return { data: data.data, meta: data.meta };
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.post<ApiSuccess<T>>(url, body, config);
  return data.data;
}

export async function apiPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.put<ApiSuccess<T>>(url, body, config);
  return data.data;
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.patch<ApiSuccess<T>>(url, body, config);
  return data.data;
}

export async function apiDelete<T = null>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.delete<ApiSuccess<T>>(url, config);
  return data.data;
}
