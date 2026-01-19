/**
 * Game Lessons API Client
 * Separate axios client for game-lessons API using NEXT_PUBLIC_GAME_LESSON_API_URL
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { tokenStorage } from "@/lib/token-storage";

// Game Lessons API base URL from environment
const GAME_LESSON_API_URL = process.env.NEXT_PUBLIC_GAME_LESSON_API_URL || "";

// Create axios instance for game-lessons API
export const gameLessonsApiClient = axios.create({
  baseURL: GAME_LESSON_API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies for auth
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
gameLessonsApiClient.interceptors.request.use(
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

// Response interceptor with retry logic
gameLessonsApiClient.interceptors.response.use(
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

    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear tokens and redirect to login
      tokenStorage.clearTokens();
      
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
      
      return Promise.reject(error);
    }

    // Retry logic for other errors (500, network errors, etc.)
    if (originalRequest._retryCount < MAX_RETRIES && shouldRetry(error)) {
      originalRequest._retryCount++;

      // Calculate delay with exponential backoff
      const delay = getRetryDelay(originalRequest._retryCount - 1);

      console.warn(
        `Game Lessons API request failed, retrying in ${delay}ms (attempt ${originalRequest._retryCount}/${MAX_RETRIES}):`,
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
      return gameLessonsApiClient(originalRequest);
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
export const gameLessonsApiGet = async <T = any>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await gameLessonsApiClient.get<T>(url, config);
  return response.data;
};

export const gameLessonsApiPost = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await gameLessonsApiClient.post<T>(url, data, config);
  return response.data;
};

export const gameLessonsApiPut = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await gameLessonsApiClient.put<T>(url, data, config);
  return response.data;
};

export const gameLessonsApiPatch = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await gameLessonsApiClient.patch<T>(url, data, config);
  return response.data;
};

export const gameLessonsApiDelete = async <T = any>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await gameLessonsApiClient.delete<T>(url, config);
  return response.data;
};

export default gameLessonsApiClient;