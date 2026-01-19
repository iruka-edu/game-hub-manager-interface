/**
 * External API Client
 * Axios instance for calling external Backend API at NEXT_PUBLIC_BASE_API_URL
 *
 * Features:
 * - Cookie-based token storage
 * - Auto-refresh on 401 with request queue
 * - Retry logic for failed requests
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { tokenStorage } from "./token-storage";

// External API base URL from environment
const EXTERNAL_API_BASE_URL = process.env.NEXT_PUBLIC_BASE_API_URL || "";

// Create axios instance for external API
export const externalApiClient = axios.create({
  baseURL: EXTERNAL_API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies for refresh token
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Refresh token state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}> = [];

/**
 * Process the queue of failed requests after refresh
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Exponential backoff delay calculation
const getRetryDelay = (retryCount: number): number => {
  return RETRY_DELAY * Math.pow(2, retryCount);
};

// Check if error should be retried
const shouldRetry = (error: AxiosError): boolean => {
  if (!error.response) return true;
  if (error.response.status >= 500) return true;
  const retryableStatus = [408, 429];
  return retryableStatus.includes(error.response.status);
};

// Request interceptor to add auth token
externalApiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor with refresh token logic and retry
externalApiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Initialize retry count
    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, add to queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return externalApiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call refresh token API (use raw axios to avoid interceptor loop)
        const response = await axios.post(
          `${EXTERNAL_API_BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
          { withCredentials: true },
        );

        const { access_token, refresh_token: newRefreshToken } = response.data;

        // Save new tokens
        tokenStorage.setToken(access_token);
        if (newRefreshToken) {
          tokenStorage.setRefreshToken(newRefreshToken);
        }

        // Update default header
        externalApiClient.defaults.headers.common["Authorization"] =
          `Bearer ${access_token}`;

        // Process queue with new token
        processQueue(null, access_token);

        // Retry original request
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return externalApiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        processQueue(refreshError, null);
        tokenStorage.clearTokens();

        // Redirect to login (client-side only)
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Retry logic for other errors (500, network errors, etc.)
    if (originalRequest._retryCount < MAX_RETRIES && shouldRetry(error)) {
      originalRequest._retryCount++;
      const delay = getRetryDelay(originalRequest._retryCount - 1);

      console.warn(
        `External API request failed, retrying in ${delay}ms (attempt ${originalRequest._retryCount}/${MAX_RETRIES}):`,
        {
          url: originalRequest.url,
          method: originalRequest.method,
          status: error.response?.status,
          message: error.message,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return externalApiClient(originalRequest);
    }

    // Enhanced error for failed requests
    const enhancedError = {
      ...error,
      message:
        (error.response?.data as any)?.detail ||
        (error.response?.data as any)?.error ||
        error.message ||
        "Đã xảy ra lỗi không xác định",
      status: error.response?.status,
      data: error.response?.data,
    };

    return Promise.reject(enhancedError);
  },
);

// Error class for external API
export class ExternalAPIError extends Error {
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
    this.name = "ExternalAPIError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Convert axios error to ExternalAPIError
 */
function handleAxiosError(error: any): never {
  if (error.response) {
    const errorData = error.response.data || {};
    throw new ExternalAPIError(
      errorData.detail || errorData.error || error.message || "Lỗi từ server",
      error.response.status,
      errorData.code,
      errorData,
    );
  } else if (error.request) {
    throw new ExternalAPIError(
      "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
      0,
      "NETWORK_ERROR",
    );
  } else {
    throw new ExternalAPIError(
      error.message || "Đã xảy ra lỗi không xác định",
      0,
      "UNKNOWN_ERROR",
    );
  }
}

/**
 * Build query string from params
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

/**
 * GET request helper
 */
export async function externalApiGet<T>(
  url: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  try {
    const queryString = params ? buildQueryString(params) : "";
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    const response = await externalApiClient.get<T>(fullUrl);
    return response.data;
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * POST request helper
 */
export async function externalApiPost<T>(
  url: string,
  body?: unknown,
): Promise<T> {
  try {
    const response = await externalApiClient.post<T>(url, body);
    return response.data;
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * PUT request helper
 */
export async function externalApiPut<T>(
  url: string,
  body?: unknown,
): Promise<T> {
  try {
    const response = await externalApiClient.put<T>(url, body);
    return response.data;
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * DELETE request helper
 */
export async function externalApiDelete<T>(
  url: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  try {
    const queryString = params ? buildQueryString(params) : "";
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    const response = await externalApiClient.delete<T>(fullUrl);
    return response.data;
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * File upload helper
 */
export async function externalApiUpload<T>(
  url: string,
  formData: FormData,
  onUploadProgress?: (progressEvent: any) => void,
): Promise<T> {
  try {
    const response = await externalApiClient.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
    return response.data;
  } catch (error) {
    return handleAxiosError(error);
  }
}

// Re-export token storage functions for backward compatibility
export {
  tokenStorage,
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearAllTokens,
} from "./token-storage";

export default externalApiClient;
