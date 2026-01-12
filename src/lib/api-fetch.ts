/**
 * API Fetch Utilities
 * Base fetch wrapper for all API calls with consistent error handling
 */

export interface APIErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export class APIError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Base fetch function with authentication and error handling
 * All API functions should use this as the base
 */
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "include", // Include cookies for session
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData: APIErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    throw new APIError(
      errorData.error || "An error occurred",
      response.status,
      errorData.code,
      errorData.details
    );
  }

  return response.json();
}

/**
 * GET request helper
 */
export function apiGet<T>(
  url: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const queryString = params ? buildQueryString(params) : "";
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  return apiFetch<T>(fullUrl, { method: "GET" });
}

/**
 * POST request helper
 */
export function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request helper
 */
export function apiPut<T>(url: string, body?: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request helper
 */
export function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper
 */
export function apiDelete<T>(url: string, body?: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "DELETE",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Build query string from params object
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "all"
    ) {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}
