/**
 * API Client Helper
 * Provides consistent error handling and response parsing for API calls
 */

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
 * Make an API call with consistent error handling
 * @param apiCall - Function that returns a fetch promise
 * @returns Result object with success flag and data or error
 */
export async function handleAPICall<T>(
  apiCall: () => Promise<Response>
): Promise<APIResult<T>> {
  try {
    const response = await apiCall();
    
    if (!response.ok) {
      const error: APIError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      
      return { success: false, error };
    }
    
    const data: T = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      error: {
        error: error instanceof Error ? error.message : 'Network error. Please try again.',
      },
    };
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
 * Fetch with authentication (includes credentials)
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for session
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}
