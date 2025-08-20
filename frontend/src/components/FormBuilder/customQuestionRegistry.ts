// Centralized registry for all custom SurveyJS question types
// Import this file once in your app to register all custom questions

// Import all custom question types
import './DateOfBirthQuestion';
import './TodaysDateQuestion';
import './BodyPainDiagramQuestion';
import './BodyDiagram2Question';
import './BodyDiagramQuestion';
import './HeightWeightSlider';
// ReviewOfSystemsQuestion removed - using native panel structure instead

// List of all custom question type names for reference
export const CUSTOM_QUESTION_TYPES = {
  DATE_OF_BIRTH: 'dateofbirth',
  TODAYS_DATE: 'todaysdate',
  BODY_PAIN_DIAGRAM: 'bodypaindiagram',
  BODY_DIAGRAM: 'bodydiagram',
  BODY_DIAGRAM_2: 'bodydiagram2',
  HEIGHT_SLIDER: 'heightslider',
  WEIGHT_SLIDER: 'weightslider',
  // REVIEW_OF_SYSTEMS removed - using native panel structure instead
} as const;

// Type for custom question data extraction
export interface CustomQuestionData {
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
  [CUSTOM_QUESTION_TYPES.TODAYS_DATE]?: {
    value: string;
    formatted?: string;
  };
  // Review of Systems data will be handled natively by SurveyJS panels
}

// Helper function to extract and flatten custom question data
export function extractCustomQuestionData(surveyData: any): any {
  const extractedData = { ...surveyData };
  
  // Patient demographics is now handled as a standard panel, not a custom question
  // The data will be in the survey results as individual fields:
  // first_name, last_name, date_of_birth, etc.
  
  // Handle date of birth question
  if (surveyData.dateofbirth && typeof surveyData.dateofbirth === 'object') {
    if (surveyData.dateofbirth.dob) {
      extractedData.patient_dob = surveyData.dateofbirth.dob;
      extractedData.patient_age = surveyData.dateofbirth.age;
    }
  }
  
  // Review of Systems data is now handled natively by SurveyJS
  // The data will be in the survey results as individual fields:
  // ros_constitutional, ros_gastrointestinal, etc.
  
  return extractedData;
}

// Helper to check if a question type is a custom type
export function isCustomQuestionType(type: string): boolean {
  return Object.values(CUSTOM_QUESTION_TYPES).includes(type as any);
}

// Initialize all custom questions when this module is imported
console.log('Custom SurveyJS questions registered:', Object.values(CUSTOM_QUESTION_TYPES));