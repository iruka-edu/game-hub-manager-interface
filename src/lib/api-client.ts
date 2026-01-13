/**
 * API Client Helper
 * Provides consistent error handling and response parsing for API calls
 */

import { apiClient } from './axios';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Standard API error response
 */
export interface APIError {
  error: string;
  code?: string;
  details?: any;
}

/**
 * API call result - either success with data or error
 */
export type APIResult<T> = 
  | { success: true; data: T }
  | { success: false; error: APIError };

/**
 * Make an API call with consistent error handling using axios
 * @param apiCall - Function that returns an axios promise
 * @returns Result object with success flag and data or error
 */
export async function handleAPICall<T>(
  apiCall: () => Promise<AxiosResponse<T>>
): Promise<APIResult<T>> {
  try {
    const response = await apiCall();
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('API call failed:', error);
    
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data || {};
      return {
        success: false,
        error: {
          error: errorData.error || error.message || 'Đã xảy ra lỗi từ server',
          code: errorData.code,
          details: errorData.details,
        },
      };
    } else if (error.request) {
      // Network error
      return {
        success: false,
        error: {
          error: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
          code: 'NETWORK_ERROR',
        },
      };
    } else {
      // Other error
      return {
        success: false,
        error: {
          error: error.message || 'Đã xảy ra lỗi không xác định',
          code: 'UNKNOWN_ERROR',
        },
      };
    }
  }
}

/**
 * Show a toast notification (to be implemented with your toast library)
 * @param message - Message to display
 * @param type - Toast type (success, error, info, warning)
 */
export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info'
): void {
  // TODO: Implement with your toast library
  // For now, just console log
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} ${message}`);
  
  // You can replace this with your toast library, e.g.:
  // toast[type](message);
}

/**
 * Build query string from filter object
 * @param filters - Object with filter key-value pairs
 * @returns Query string (without leading ?)
 */
export function buildQueryString(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      params.set(key, String(value));
    }
  });
  
  return params.toString();
}

/**
 * Authenticated request using axios (credentials included automatically)
 * @param url - API endpoint URL
 * @param config - Axios request config
 * @returns Axios response
 */
export async function authenticatedRequest<T = any>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> {
  return apiClient.request<T>({
    url,
    ...config,
  });
}

// Legacy compatibility - deprecated, use axios directly
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  console.warn('authenticatedFetch is deprecated, use axios-based functions instead');
  
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : undefined;

  try {
    const response = await apiClient.request({
      url,
      method: method as any,
      data: body,
      headers: options.headers as any,
    });

    // Convert axios response to fetch-like response for compatibility
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
    } as Response;
  } catch (error: any) {
    throw new Error(error.message || 'Request failed');
  }
}
