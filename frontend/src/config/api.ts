// API configuration
const API_URL = process.env.REACT_APP_API_URL === '' ? '/api' : (process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1');
const BASE_URL = process.env.REACT_APP_BASE_URL === '' ? '' : (process.env.REACT_APP_BASE_URL || 'http://localhost:8000');

// Remove trailing slash if present
export const getApiUrl = () => {
  return API_URL.replace(/\/$/, '');
};

// Remove trailing slash if present
export const getBaseUrl = () => {
  return BASE_URL.replace(/\/$/, '');
};

// Helper to construct full API URLs
export const apiEndpoints = {
  forms: {
    get: (formId: string) => `${getApiUrl()}/forms/${formId}/`,
    responses: (formId: string) => `${getApiUrl()}/forms/${formId}/responses/`,
    // Public form access - moved under /api to avoid routing conflicts
    public: (formId: string, token: string) => `${getApiUrl()}/forms/${formId}/public/${token}`,
  },
  responses: {
    // Public submission endpoint (no auth required)
    submitPublic: () => `${getApiUrl()}/responses/public`,
  },
};