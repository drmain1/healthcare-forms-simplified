// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  settings: Record<string, any>;
  subscription_tier: 'trial' | 'basic' | 'professional' | 'enterprise';
  is_active: boolean;
  created_at: string;
}

export interface OrganizationSettings {
  organization: string;
  logo?: string;
  primary_color: string;
  secondary_color: string;
  default_form_theme: string;
  require_patient_consent: boolean;
  auto_save_responses: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  response_retention_days: number;
  auto_archive_forms: boolean;
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  organization: string;
  role: 'admin' | 'physician' | 'nurse' | 'staff' | 'viewer';
  permissions: string[];
  phone: string;
  department: string;
  hipaa_training_completed: boolean;
  hipaa_training_date?: string;
  access_level: 'limited' | 'standard' | 'full';
  last_login?: string;
}

// Form Types
export interface Form {
  id: string;
  organization: string;
  title: string;
  description: string;
  surveyjs_schema: any; // SurveyJS JSON schema
  status: 'draft' | 'active' | 'paused' | 'archived';
  allow_anonymous: boolean;
  require_authentication: boolean;
  auto_save: boolean;
  allow_partial_submission: boolean;
  contains_phi: boolean;
  encryption_required: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  template?: string;
  response_count: number;
  completion_rate: number;
}

export interface FormTemplate {
  id: string;
  organization?: string;
  name: string;
  category: 'intake' | 'medical_history' | 'consent' | 'assessment' | 'discharge' | 'insurance' | 'other';
  description: string;
  surveyjs_schema: any;
  fhir_mapping: Record<string, any>;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormVersion {
  id: string;
  form: string;
  version: number;
  surveyjs_schema: any;
  change_notes: string;
  created_at: string;
  created_by: string;
}

// Patient Types
export interface Patient {
  id: string;
  organization: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  date_of_birth: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  mrn: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  insurance_provider: string;
  insurance_policy_number: string;
  insurance_group_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  demographics: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  consent_given: boolean;
  consent_date?: string;
  data_sharing_consent: boolean;
  full_name: string;
  age: number;
}

// Response Types
export interface FormResponse {
  id: string;
  organization: string;
  form: string;
  patient?: string;
  patient_name?: string; // Added from serializer
  form_title?: string; // Added from serializer
  response_data: any; // SurveyJS response data
  status: 'in_progress' | 'completed' | 'submitted' | 'reviewed' | 'archived';
  started_at: string;
  submitted_at?: string;
  completion_time_seconds?: number;
  user_agent: string;
  ip_address?: string;
  session_id: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  fhir_resource?: any;
  exported_to_emr?: boolean;
  emr_export_date?: string;
}

// Distribution Types
export interface FormDistribution {
  id: string;
  organization: string;
  form: string;
  distribution_method: 'email' | 'sms' | 'qr_code' | 'direct_link' | 'embedded' | 'bulk_email';
  recipients: string[];
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  completed_count: number;
  subject: string;
  message: string;
  send_reminder: boolean;
  reminder_days: number;
  scheduled_at?: string;
  sent_at?: string;
  expires_at?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'completed' | 'cancelled' | 'failed';
  created_at: string;
  created_by: string;
  campaign_name: string;
  campaign_tags: string[];
  delivery_rate: number;
  response_rate: number;
}

// Authentication Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
  organization: Organization;
}

export interface TokenRefreshRequest {
  refresh: string;
}

export interface TokenRefreshResponse {
  access: string;
}

// SurveyJS Types
export interface SurveyJSConfig {
  questionTypes: Record<string, any>;
  themes: Record<string, any>;
  validators: Record<string, any>;
}

// Dashboard Types
export interface DashboardStats {
  total_forms: number;
  active_forms: number;
  total_responses: number;
  completed_responses: number;
  total_patients: number;
  forms_this_month: number;
  responses_this_month: number;
  completion_rate: number;
  average_completion_time: number;
}

export interface RecentActivity {
  id: string;
  type: 'form_created' | 'response_submitted' | 'patient_added' | 'form_distributed';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  metadata: Record<string, any>;
}

// UI State Types
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// Filter and Pagination Types
export interface FilterParams {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  category?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

// Route Types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  roles?: string[];
}

export default {};