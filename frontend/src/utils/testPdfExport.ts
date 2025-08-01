import { SurveyPDF } from 'survey-pdf';

export const testPdfGeneration = () => {
  try {
    // Create a minimal test survey
    const testSurvey = {
      title: "Test Form",
      pages: [{
        name: "page1",
        elements: [{
          type: "text",
          name: "test_question",
          title: "What is your name?"
        }]
      }]
    };

    const pdfOptions = {
      fontSize: 12,
      format: 'letter',
      margins: {
        left: 10,
        right: 10,
        top: 10,
        bot: 10
      }
    };

    // Create PDF
    const surveyPdf = new SurveyPDF(testSurvey, pdfOptions);
    surveyPdf.data = { test_question: "Test User" };
    
    // Try to save
    surveyPdf.save("test.pdf");
    
    console.log("PDF generation test successful!");
    return { success: true };
  } catch (error) {
    console.error("PDF generation test failed:", error);
    return { success: false, error };
  }
};