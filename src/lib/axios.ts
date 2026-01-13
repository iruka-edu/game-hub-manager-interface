/**
 * Axios Configuration with Retry Mechanism
 * Centralized HTTP client for all API calls
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
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
    // Add any auth headers here if needed
    // For cookie-based auth, cookies are sent automatically
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };
    
    // Initialize retry count
    if (!config._retryCount) {
      config._retryCount = 0;
    }

    // Check if we should retry
    if (config._retryCount < MAX_RETRIES && shouldRetry(error)) {
      config._retryCount++;
      
      // Calculate delay with exponential backoff
      const delay = getRetryDelay(config._retryCount - 1);
      
      console.warn(`API request failed, retrying in ${delay}ms (attempt ${config._retryCount}/${MAX_RETRIES}):`, {
        url: config.url,
        method: config.method,
        status: error.response?.status,
        message: error.message,
      });

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the request
      return apiClient(config);
    }

    // If we've exhausted retries or shouldn't retry, reject with enhanced error
    const enhancedError = {
      ...error,
      message: error.response?.data?.error || error.message || 'Đã xảy ra lỗi không xác định',
      status: error.response?.status,
      data: error.response?.data,
    };

    return Promise.reject(enhancedError);
  }
);

// Utility functions for common HTTP methods
export const apiGet = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

export const apiPost = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

export const apiPut = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

export const apiPatch = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
};

export const apiDelete = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};

// File upload utility
export const apiUpload = async <T = any>(
  url: string, 
  formData: FormData, 
  config?: AxiosRequestConfig & { onUploadProgress?: (progressEvent: any) => void }
): Promise<T> => {
  const response = await apiClient.post<T>(url, formData, {
    ...config,
    headers: {
      ...config?.headers,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default apiClient;