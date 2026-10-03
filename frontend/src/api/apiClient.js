import axios from 'axios';
import i18n from '../i18n/index.js';

const TOKEN_STORAGE_KEY = 'nestmates.token';

export const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

export const tokenStorage = {
  get() {
    try {
      return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // Without storage the session lasts until the page is closed.
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
  },
};

/** Normalised error for every failed request, following the SDD format { error: { code, message, details } }. */
export class ApiError extends Error {
  constructor({ status = null, code, message, details = null }) {
    super(message || code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const CODES_BY_STATUS = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'RATE_LIMITED',
  502: 'SERVICE_UNAVAILABLE',
  503: 'SERVICE_UNAVAILABLE',
  504: 'SERVICE_UNAVAILABLE',
};

function toApiError(error) {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError({ code: 'TIMEOUT', message: error.message });
  }
  if (!error.response) {
    return new ApiError({ code: 'NETWORK_ERROR', message: error.message });
  }

  const { status, data } = error.response;
  const body = data && typeof data === 'object' ? data.error : null;
  return new ApiError({
    status,
    code: body?.code ?? CODES_BY_STATUS[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN'),
    message: body?.message,
    details: body?.details ?? null,
  });
}

/**
 * Returns the translation key describing an error. `overrides` maps an API reason
 * (`error.details.reason`) or code (`error.code`) to a more specific key for the current
 * form, e.g. { EMAIL_TAKEN: 'profileSettings.details.emailTaken' }.
 */
export function getErrorMessageKey(error, overrides = {}) {
  const reason = error?.details?.reason;
  if (reason && overrides[reason]) return overrides[reason];
  const code = error?.code ?? 'UNKNOWN';
  if (overrides[code]) return overrides[code];
  const key = `errors.${code}`;
  return i18n.exists(key) ? key : 'errors.UNKNOWN';
}

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

const apiClient = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  // The server gives new accounts the language the visitor is using (FR-ACC-16).
  if (i18n.language) config.headers['Accept-Language'] = i18n.language;
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error);
    // Only an authenticated request can reveal an expired session; a failed login is a form error.
    if (apiError.status === 401 && error.config?.headers?.Authorization) {
      unauthorizedHandler?.();
    }
    return Promise.reject(apiError);
  },
);

export default apiClient;
