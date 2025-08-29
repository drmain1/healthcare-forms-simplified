import { ComponentCollection, Serializer } from 'survey-core';

// Register the Patient History Panel component
export class PatientHistoryPanel {
  constructor() {
    this.init();
  }

  init() {
    // Register the custom panel with SurveyJS
    // This is a standard panel but with predefined structure and metadata
    console.log('[SurveyJS] Registering Patient History Panel component...');
  }
}

// Initialize the component
const patientHistoryPanel = new PatientHistoryPanel();

// Export default instance
export default patientHistoryPanel;