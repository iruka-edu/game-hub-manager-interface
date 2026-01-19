/**
 * Axios Configuration with Retry Mechanism
 * Centralized HTTP client for all API calls to external backend
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { tokenStorage } from "./token-storage";

// External API base URL from environment
const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL || "";

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: BASE_API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies for refresh token
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// Exponential backoff delay calculation
const getRetryDelay = (retryCount: number): number => {
  return RETRY_DELAY * Math.pow(2, retryCount);
};

// Check if error should be retried
const shouldRetry = (error: AxiosError): boolean => {
  // Retry on network errors
  if (!error.response) {
    return true;
  }

  // Retry on 5xx server errors
  if (error.response.status >= 500) {
    return true;
  }

  // Retry on specific 4xx errors
  const retryableStatus = [408, 429]; // Request Timeout, Too Many Requests
  return retryableStatus.includes(error.response.status);
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

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

// Response interceptor with refresh token logic and retry
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
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
            return apiClient(originalRequest);
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
        // Backend reads refresh_token from cookie automatically
        const response = await axios.post(
          `${BASE_API_URL}/api/v1/auth/refresh`,
          {}, // Empty body - backend reads refresh_token from cookie
          { withCredentials: true },
        );

        const { access_token, refresh_token: newRefreshToken } = response.data;

        // Save new tokens
        tokenStorage.setToken(access_token);
        if (newRefreshToken) {
          tokenStorage.setRefreshToken(newRefreshToken);
        }

        // Update default header
        apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${access_token}`;

        // Process queue with new token
        processQueue(null, access_token);

        // Retry original request
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
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

      // Calculate delay with exponential backoff
      const delay = getRetryDelay(originalRequest._retryCount - 1);

      console.warn(
        `API request failed, retrying in ${delay}ms (attempt ${originalRequest._retryCount}/${MAX_RETRIES}):`,
        {
          url: originalRequest.url,
          method: originalRequest.method,
          status: error.response?.status,
          message: error.message,
        },
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry the request
      return apiClient(originalRequest);
    }

    // If we've exhausted retries or shouldn't retry, reject with enhanced error
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

// Utility functions for common HTTP methods
export const apiGet = async <T = any>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

export const apiPost = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

export const apiPut = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

export const apiPatch = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
};

export const apiDelete = async <T = any>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};

// File upload utility
export const apiUpload = async <T = any>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig & {
    onUploadProgress?: (progressEvent: any) => void;
  },
): Promise<T> => {
  const response = await apiClient.post<T>(url, formData, {
    ...config,
    headers: {
      ...config?.headers,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export default apiClient;
