// API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

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
    // Public form access is at root level, not under /api
    public: (formId: string, token: string) => `${getBaseUrl()}/forms/${formId}/fill/${token}`,
  },
  responses: {
    // Public submission endpoint (no auth required)
    submitPublic: () => `${getBaseUrl()}/responses/public`,
  },
};