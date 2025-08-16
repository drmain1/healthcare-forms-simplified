// Centralized registry for all custom SurveyJS question types
// Import this file once in your app to register all custom questions

// Import all custom question types
import './DateOfBirthQuestion';
import './BodyPainDiagramQuestion';
import './BodyDiagram2Question';
import './PatientDemographicsQuestion';
import './BodyDiagramQuestion';

// List of all custom question type names for reference
export const CUSTOM_QUESTION_TYPES = {
  DATE_OF_BIRTH: 'dateofbirth',
  BODY_PAIN_DIAGRAM: 'bodypaindiagram',
  BODY_DIAGRAM: 'bodydiagram',
  BODY_DIAGRAM_2: 'bodydiagram2',
  PATIENT_DEMOGRAPHICS: 'patient_demographics',
} as const;

// Type for custom question data extraction
export interface CustomQuestionData {
  [CUSTOM_QUESTION_TYPES.PATIENT_DEMOGRAPHICS]?: {
    firstName: string;
    lastName: string;
    preferredName: string;
    dob: string;
    email: string;
    primaryPhone: string;
    secondaryPhone: string;
    cellPhone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  [CUSTOM_QUESTION_TYPES.BODY_PAIN_DIAGRAM]?: Array<{
    id: string;
    x: number;
    y: number;
    intensity: number;
    label?: string;
  }>;
  [CUSTOM_QUESTION_TYPES.BODY_DIAGRAM_2]?: Array<{
    id: string;
    x: number;
    y: number;
    sensation: string;
  }>;
  [CUSTOM_QUESTION_TYPES.DATE_OF_BIRTH]?: {
    dob: string;
    age?: number;
  };
}

// Helper function to extract and flatten custom question data
export function extractCustomQuestionData(surveyData: any): any {
  const extractedData = { ...surveyData };
  
  // Handle patient demographics - flatten the nested object
  if (surveyData.patient_demographics && typeof surveyData.patient_demographics === 'object') {
    const demographics = surveyData.patient_demographics;
    
    // Extract key fields to top level for easier access
    if (demographics.firstName) extractedData.first_name = demographics.firstName;
    if (demographics.lastName) extractedData.last_name = demographics.lastName;
    if (demographics.dob) extractedData.patient_dob = demographics.dob;
    if (demographics.email) extractedData.patient_email = demographics.email;
    if (demographics.primaryPhone) extractedData.patient_phone = demographics.primaryPhone;
    if (demographics.address) extractedData.patient_address = demographics.address;
    if (demographics.city) extractedData.patient_city = demographics.city;
    if (demographics.state) extractedData.patient_state = demographics.state;
    if (demographics.zip) extractedData.patient_zip = demographics.zip;
    
    // Keep the original nested object as well for completeness
    extractedData.patient_demographics = demographics;
  }
  
  // Handle date of birth question
  if (surveyData.dateofbirth && typeof surveyData.dateofbirth === 'object') {
    if (surveyData.dateofbirth.dob) {
      extractedData.patient_dob = surveyData.dateofbirth.dob;
      extractedData.patient_age = surveyData.dateofbirth.age;
    }
  }
  
  return extractedData;
}

// Helper to check if a question type is a custom type
export function isCustomQuestionType(type: string): boolean {
  return Object.values(CUSTOM_QUESTION_TYPES).includes(type as any);
}

// Initialize all custom questions when this module is imported
console.log('Custom SurveyJS questions registered:', Object.values(CUSTOM_QUESTION_TYPES));