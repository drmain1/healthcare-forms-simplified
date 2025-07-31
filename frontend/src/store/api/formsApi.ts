import { baseApi } from './baseApi';
import { Form, FormTemplate, PaginatedResponse, FilterParams } from '../../types';

export interface CreateFormRequest {
  title: string;
  description?: string;
  surveyJson: any;  // Changed from surveyjs_schema to match backend
  category?: string;
  tags?: string[];
  isTemplate?: boolean;
}

export interface UpdateFormRequest extends Partial<CreateFormRequest> {
  id: string;
}

export const formsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all forms with filtering and pagination
    getForms: builder.query<PaginatedResponse<Form>, FilterParams>({
      query: (params = {}) => ({
        url: '/forms/',
        params: {
          page: params.page || 1,
          page_size: params.page_size || 20,
          search: params.search || '',
          status: params.status || '',
          category: params.category || '',
          ordering: params.ordering || '-created_at',
        },
      }),
      providesTags: ['Form'],
    }),

    // Get single form by ID
    getForm: builder.query<Form, string>({
      query: (id) => `/forms/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Form', id }],
    }),

    // Create new form
    createForm: builder.mutation<Form, CreateFormRequest>({
      query: (data) => ({
        url: '/forms/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Form'],
    }),

    // Update existing form
    updateForm: builder.mutation<Form, UpdateFormRequest>({
      query: ({ id, ...data }) => ({
        url: `/forms/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Form', id },
        'Form',
      ],
    }),

    // Delete form
    deleteForm: builder.mutation<void, string>({
      query: (id) => ({
        url: `/forms/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Form', id },
        'Form',
      ],
    }),

    // Duplicate form
    duplicateForm: builder.mutation<Form, { id: string; title?: string }>({
      query: ({ id, title }) => ({
        url: `/forms/${id}/duplicate/`,
        method: 'POST',
        body: { title },
      }),
      invalidatesTags: ['Form'],
    }),

    // Get form templates
    getFormTemplates: builder.query<FormTemplate[], void>({
      query: () => '/form-templates/',
      providesTags: ['FormTemplate'],
    }),

    // Test form (validate SurveyJS schema)
    testForm: builder.mutation<{ valid: boolean; errors?: string[] }, any>({
      query: (surveyJson) => ({
        url: '/forms/test/',
        method: 'POST',
        body: { surveyJson },
      }),
    }),

    // Publish form (change status to active)
    publishForm: builder.mutation<Form, string>({
      query: (id) => ({
        url: `/forms/${id}/publish/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Form', id },
        'Form',
      ],
    }),

    // Archive form
    archiveForm: builder.mutation<Form, string>({
      query: (id) => ({
        url: `/forms/${id}/archive/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Form', id },
        'Form',
      ],
    }),

    // Get form analytics
    getFormAnalytics: builder.query<any, string>({
      query: (id) => `/forms/${id}/analytics/`,
      providesTags: (_result, _error, id) => [{ type: 'Analytics', id }],
    }),

    // Form sharing endpoints
    createShareLink: builder.mutation<any, { formId: string; shareSettings: any }>({
      query: ({ formId, shareSettings }) => ({
        url: `/forms/${formId}/create_share_link/`,
        method: 'POST',
        body: shareSettings,
      }),
      invalidatesTags: ['Form'],
    }),

    getShareLinks: builder.query<any[], string>({
      query: (formId) => `/forms/${formId}/share_links/`,
      providesTags: ['Form'],
    }),

    deactivateShareLink: builder.mutation<any, string>({
      query: (shareId) => ({
        url: `/form-shares/${shareId}/deactivate/`,
        method: 'POST',
      }),
      invalidatesTags: ['Form'],
    }),

    // Dashboard endpoints
    getDashboardStats: builder.query<any, void>({
      query: () => '/forms/dashboard_stats/',
      providesTags: ['Form', 'Analytics'],
    }),

    getRecentActivity: builder.query<any[], void>({
      query: () => '/forms/recent_activity/',
      providesTags: ['Form', 'Analytics'],
    }),
  }),
});

export const {
  useGetFormsQuery,
  useGetFormQuery,
  useCreateFormMutation,
  useUpdateFormMutation,
  useDeleteFormMutation,
  useDuplicateFormMutation,
  useGetFormTemplatesQuery,
  useTestFormMutation,
  usePublishFormMutation,
  useArchiveFormMutation,
  useGetFormAnalyticsQuery,
  useCreateShareLinkMutation,
  useGetShareLinksQuery,
  useDeactivateShareLinkMutation,
  useGetDashboardStatsQuery,
  useGetRecentActivityQuery,
} = formsApi;