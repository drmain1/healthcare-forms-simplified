import { Serializer } from 'survey-core';

/**
 * Initialize metadata property for all SurveyJS elements.
 * This must be called BEFORE any custom questions are registered
 * to ensure metadata is recognized as a valid property.
 */
export function initializeSurveyMetadata() {
  console.log('[SurveyJS] Initializing metadata support...');
  
  // Add metadata property to ALL questions (including custom ones)
  if (!Serializer.findProperty("question", "metadata")) {
    Serializer.addProperty("question", {
      name: "metadata",
      type: "any",
      category: "general",
      isSerializable: true,
      visible: false,
      default: null
    });
    console.log('[SurveyJS] Added metadata property to all questions');
  }
  
  // Add metadata property to ALL panels
  if (!Serializer.findProperty("panel", "metadata")) {
    Serializer.addProperty("panel", {
      name: "metadata",
      type: "any",
      category: "general",
      isSerializable: true,
      visible: false,
      default: null
    });
    console.log('[SurveyJS] Added metadata property to all panels');
  }
  
  // Add metadata property to pages (for completeness)
  if (!Serializer.findProperty("page", "metadata")) {
    Serializer.addProperty("page", {
      name: "metadata",
      type: "any",
      category: "general",
      isSerializable: true,
      visible: false,
      default: null
    });
    console.log('[SurveyJS] Added metadata property to all pages');
  }
  
  console.log('[SurveyJS] Metadata support initialized successfully');
}