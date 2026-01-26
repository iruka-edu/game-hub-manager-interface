/**
 * API Fetch Utilities - Axios Implementation
 * Base axios wrapper for all API calls with retry mechanism and consistent error handling
 */

import {
  apiGet as axiosGet,
  apiPost as axiosPost,
  apiPut as axiosPut,
  apiPatch as axiosPatch,
  apiDelete as axiosDelete,
  apiUpload as axiosUpload,
} from "./axios";

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
    details?: unknown,
  ) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Convert axios error to APIError
 */
function pickErrorMessage(error: any, errorData: any): string {
  const candidates = [
    errorData?.error,
    errorData?.message,
    error?.message,
  ];

  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === "string") return c;
    try {
      return JSON.stringify(c);
    } catch {
      return String(c);
    }
  }

  // fallback cuối
  try {
    return JSON.stringify(errorData);
  } catch {
    return "Đã xảy ra lỗi từ server";
  }
}

function handleAxiosError(error: any): never {
  if (error.response) {
    const errorData = error.response.data || {};
    throw new APIError(
      pickErrorMessage(error, errorData),
      error.response.status,
      errorData.code,
      errorData.details,
    );
  } else if (error.request) {
    throw new APIError(
      "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
      0,
      "NETWORK_ERROR",
    );
  } else {
    throw new APIError(
      typeof error?.message === "string" ? error.message : "Đã xảy ra lỗi không xác định",
      0,
      "UNKNOWN_ERROR",
    );
  }
}


/**
 * GET request helper with error handling
 */
export async function apiGet<T>(
  url: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  try {
    const queryString = params ? buildQueryString(params) : "";
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return await axiosGet<T>(fullUrl);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * POST request helper with error handling
 */
export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  try {
    return await axiosPost<T>(url, body);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * PUT request helper with error handling
 */
export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  try {
    return await axiosPut<T>(url, body);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * PATCH request helper with error handling
 */
export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  try {
    return await axiosPatch<T>(url, body);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * DELETE request helper with error handling
 */
export async function apiDelete<T>(
  url: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  try {
    const queryString = params ? buildQueryString(params) : "";
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return await axiosDelete<T>(fullUrl);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * File upload helper with error handling
 */
export async function apiUpload<T>(
  url: string,
  formData: FormData,
  onUploadProgress?: (progressEvent: any) => void,
): Promise<T> {
  try {
    return await axiosUpload<T>(url, formData, { onUploadProgress });
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Build query string from params object
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>,
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

// Legacy compatibility - keep the old apiFetch function for backward compatibility
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : undefined;

  switch (method) {
    case "GET":
      return apiGet<T>(url);
    case "POST":
      return apiPost<T>(url, body);
    case "PUT":
      return apiPut<T>(url, body);
    case "PATCH":
      return apiPatch<T>(url, body);
    case "DELETE":
      return apiDelete<T>(url, body);
    default:
      throw new APIError(
        `Unsupported method: ${method}`,
        0,
        "UNSUPPORTED_METHOD",
      );
  }
}
