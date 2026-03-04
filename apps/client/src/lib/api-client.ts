import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// API Error Response Types
interface ValidationDetail {
  field: string;
  message: string;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationDetail[];
  };
}

// Type guard for API error response
function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    data.success === false &&
    'error' in data &&
    typeof data.error === 'object' &&
    data.error !== null
  );
}

// Create separate instances for company and admin APIs
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const adminApiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('talentradar_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('talentradar_admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle errors globally
const handleResponseError = (error: AxiosError<ApiErrorResponse | unknown>, tokenKey: string, loginPath: string) => {
  // Handle 401 Unauthorized
  if (error.response?.status === 401) {
    localStorage.removeItem(tokenKey);
    window.location.href = loginPath;
    return Promise.reject(error);
  }

  // Handle validation errors and other API errors
  const errorData = error.response?.data;

  if (isApiErrorResponse(errorData)) {
    const { error: apiError } = errorData;

    // Handle validation errors with details array
    if (apiError.code === 'VALIDATION_ERROR' && apiError.details && Array.isArray(apiError.details)) {
      const details = apiError.details;
      // Single validation error - show inline
      if (details.length === 1) {
        toast.error(details[0].message);
      }
      // Multiple validation errors - show as list
      else {
        const errorList = details
          .map((d) => d.field ? `${d.field}: ${d.message}` : d.message)
          .join('\n');

        toast.error(`Validation errors:\n${errorList}`, {
          style: { whiteSpace: 'pre-line' }
        });
      }
      return Promise.reject(error); // Early return after showing validation errors
    }
    // Handle other API errors with just a message
    else if (apiError.message) {
      console.log(apiError.message);
      toast.error(apiError.message);
      return Promise.reject(error); // Early return
    }
    // Fallback to generic error
    else {
      toast.error('An error occurred. Please try again.');
      return Promise.reject(error); // Early return
    }
  }
  // Handle network errors or errors without response
  else if (error.message) {
    if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error(error.message);
    }
  }
  // Ultimate fallback
  else {
    toast.error('An unexpected error occurred.');
  }

  return Promise.reject(error);
};

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => handleResponseError(error, 'talentradar_token', '/login')
);

adminApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => handleResponseError(error, 'talentradar_admin_token', '/admin/login')
);
