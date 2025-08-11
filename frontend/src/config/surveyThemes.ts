import { Model } from "survey-core";
import * as SurveyTheme from "survey-core/themes";

// ===============================
// SurveyJS Theme Configuration
// ===============================

// Define a custom theme for the patient-facing form
export const patientFormTheme = {
  ...SurveyTheme.DefaultLightPanelless,
  "isPanelless": true,
};

// Function to apply theme to a survey
export const applySurveyTheme = (survey: any, isViewer: boolean = false) => {
  if (isViewer) {
    survey.applyTheme(patientFormTheme);
  } else {
    survey.applyTheme("defaultV2");
  }
};

// Function to apply theme to form builder
export const applyCreatorTheme = (creator: any) => {
  creator.theme = "defaultV2";
};