import { baseApi } from './baseApi';
import { FormResponse, PaginatedResponse, FilterParams } from '../../types';

export interface ResponseFilterParams extends FilterParams {
  form?: string;
  status?: string;
  patient?: string;
  reviewed?: boolean;
}

export const responsesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all responses with filtering and pagination
    getResponses: builder.query<PaginatedResponse<FormResponse>, ResponseFilterParams>({
      query: (params = {}) => ({
        url: '/responses/',
        params: {
          page: params.page || 1,
          page_size: params.page_size || 20,
          search: params.search || '',
          form: params.form || '',
          status: params.status || '',
          patient: params.patient || '',
          reviewed: params.reviewed !== undefined ? params.reviewed : '',
          ordering: params.ordering || '-submitted_at',
        },
      }),
      providesTags: ['Response'],
    }),

    // Get responses for a specific form
    getFormResponses: builder.query<PaginatedResponse<FormResponse>, { formId: string } & FilterParams>({
      query: ({ formId, ...params }) => ({
        url: '/responses/',
        params: {
          form: formId,
          page: params.page || 1,
          page_size: params.page_size || 20,
          search: params.search || '',
          status: params.status || '',
          ordering: params.ordering || '-submitted_at',
        },
      }),
      providesTags: ['Response'],
    }),

    // Get single response by ID
    getResponse: builder.query<FormResponse, string>({
      query: (id) => `/responses/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Response', id }],
    }),

    // Mark response as reviewed
    markResponseReviewed: builder.mutation<FormResponse, string>({
      query: (id) => ({
        url: `/responses/${id}/review`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Response', id },
        'Response',
      ],
    }),

    // Export response as PDF
    exportResponsePdf: builder.mutation<Blob, string>({
      query: (id) => ({
        url: `/responses/${id}/export_pdf/`,
        method: 'GET',
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    // Delete response
    deleteResponse: builder.mutation<void, string>({
      query: (id) => ({
        url: `/responses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Response', id },
        'Response',
      ],
    }),

    // Get response analytics
    getResponseAnalytics: builder.query<any, string>({
      query: (formId) => `/forms/${formId}/analytics/`,
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetResponsesQuery,
  useGetFormResponsesQuery,
  useGetResponseQuery,
  useMarkResponseReviewedMutation,
  useExportResponsePdfMutation,
  useDeleteResponseMutation,
  useGetResponseAnalyticsQuery,
} = responsesApi;