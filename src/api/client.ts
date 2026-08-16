import type { ApiErrorResponse } from './types';

export class ApiClientError extends Error {
  status: number;
  data?: ApiErrorResponse;

  constructor(message: string, status: number, data?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | null | undefined>;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    }
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    throw new ApiClientError(
      'Не удалось подключиться к серверу FinFlow. Проверьте, запущен ли бэкенд.',
      0
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMessage = `Ошибка ${response.status}: ${response.statusText}`;

    if (data && typeof data === 'object') {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail
          .map((err: any) => `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`)
          .join('; ');
      } else if (data.message) {
        errorMessage = data.message;
      }
    }

    throw new ApiClientError(errorMessage, response.status, data);
  }

  return data as T;
}
