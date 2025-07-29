// API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Remove trailing slash if present
export const getApiUrl = () => {
  return API_URL.replace(/\/$/, '');
};

// Helper to construct full API URLs
export const apiEndpoints = {
  forms: {
    get: (formId: string) => `${getApiUrl()}/forms/${formId}/`,
    responses: (formId: string) => `${getApiUrl()}/forms/${formId}/responses/`,
    public: (formId: string, token: string) => `${getApiUrl()}/forms/${formId}/fill/${token}/`,
  },
  responses: {
    submitPublic: () => `${getApiUrl()}/responses/submit_public/`,
  },
};