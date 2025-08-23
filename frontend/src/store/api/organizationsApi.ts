import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { firebaseAuth } from '../../services/firebaseAuth';

interface ClinicInfo {
  clinic_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  fax?: string;
  email: string;
  website?: string;
  tax_id?: string;
  npi?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

interface Organization {
  _id: string;
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  clinic_info?: ClinicInfo;
  settings: {
    hipaa_compliant: boolean;
    data_retention_days: number;
    timezone: string;
  };
  created_at: string;
  updated_at: string;
}

const apiUrl = process.env.REACT_APP_API_URL === '' ? '/api' : (process.env.REACT_APP_API_URL || 'http://localhost:8080/api');

export const organizationsApi = createApi({
  reducerPath: 'organizationsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: apiUrl,
    prepareHeaders: async (headers) => {
      const token = await firebaseAuth.getIdToken();
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Organization', 'ClinicInfo'],
  endpoints: (builder) => ({
    getOrganization: builder.query<Organization, string>({
      query: (id) => `/organizations/${id}`,
      providesTags: ['Organization'],
    }),
    getClinicInfo: builder.query<ClinicInfo, string>({
      query: (id) => `/organizations/${id}/clinic-info`,
      providesTags: ['ClinicInfo'],
    }),
    updateClinicInfo: builder.mutation<{ message: string; clinic_info: ClinicInfo }, { id: string; data: ClinicInfo }>({
      query: ({ id, data }) => ({
        url: `/organizations/${id}/clinic-info`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ClinicInfo', 'Organization'],
    }),
  }),
});

export const {
  useGetOrganizationQuery,
  useGetClinicInfoQuery,
  useUpdateClinicInfoMutation,
} = organizationsApi;