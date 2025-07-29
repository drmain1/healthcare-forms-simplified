import { SurveyPDF, IDocOptions } from 'survey-pdf';
import { Model } from 'survey-core';

/**
 * Create a flattened version of the form that's optimized for PDF
 */
export const createFlattenedFormSchema = (
  originalSchema: any,
  responseData: any,
  formTitle: string
): any => {
  const model = new Model(originalSchema);
  model.data = responseData;
  
  const flattenedElements: any[] = [];
  
  // Get all questions and their values
  model.getAllQuestions().forEach((question) => {
    const value = responseData[question.name];
    
    if (value !== undefined && value !== null && value !== '') {
      // Create a simple text element for each Q&A
      const element: any = {
        type: 'html',
        name: `${question.name}_display`,
        html: ''
      };
      
      // Format the question and answer
      const questionTitle = question.title || question.name;
      let formattedAnswer = '';
      
      switch (question.getType()) {
        case 'checkbox':
          formattedAnswer = Array.isArray(value) ? value.join(', ') : String(value);
          break;
        case 'radiogroup':
        case 'dropdown':
          formattedAnswer = String(value);
          break;
        case 'rating':
          formattedAnswer = `${value} out of ${(question as any).rateMax || 5}`;
          break;
        case 'boolean':
          formattedAnswer = value ? 'Yes' : 'No';
          break;
        case 'matrix':
        case 'matrixdynamic':
        case 'matrixdropdown':
          // Format matrix data as a simple list
          if (Array.isArray(value)) {
            formattedAnswer = value.map((row: any, index: number) => {
              return `Row ${index + 1}: ${Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(', ')}`;
            }).join('<br>');
          } else if (typeof value === 'object') {
            formattedAnswer = Object.entries(value).map(([k, v]) => `${k}: ${v}`).join('<br>');
          } else {
            formattedAnswer = String(value);
          }
          break;
        case 'file':
          formattedAnswer = 'File uploaded';
          break;
        case 'signaturepad':
          formattedAnswer = 'Signature captured';
          break;
        case 'comment':
        case 'text':
        default:
          formattedAnswer = String(value);
          // Escape HTML and preserve line breaks
          formattedAnswer = formattedAnswer
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
      }
      
      // Create HTML content
      element.html = `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
            ${questionTitle}
          </div>
          <div style="color: #666; padding-left: 10px;">
            ${formattedAnswer}
          </div>
        </div>
      `;
      
      flattenedElements.push(element);
    }
  });
  
  // Create a single-page schema
  return {
    title: formTitle,
    showProgressBar: false,
    showQuestionNumbers: 'off',
    pages: [{
      name: 'responses',
      elements: flattenedElements
    }]
  };
};

/**
 * Generate a flattened PDF that's more reliable
 */
export const generateFlattenedPdf = (
  formSchema: any,
  responseData: any,
  formTitle: string,
  patientName?: string,
  submittedDate?: Date | string
): { success: boolean; filename?: string; error?: string } => {
  try {
    // Create flattened schema
    const flattenedSchema = createFlattenedFormSchema(formSchema, responseData, formTitle);
    
    // PDF options optimized for flattened content
    const pdfOptions: IDocOptions = {
      fontSize: 11,
      format: 'letter',
      margins: {
        left: 20,
        right: 20,  
        top: 30,
        bot: 20
      },
      fontName: 'Helvetica',
      compress: false,
      orientation: 'p'
    };
    
    // Create PDF
    const surveyPdf = new SurveyPDF(flattenedSchema, pdfOptions);
    
    // No need to set data as it's already in the HTML
    
    // Add title
    surveyPdf.docTitle = formTitle;
    
    // Add header information
    const headerHtml = `
      <div style="margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">
        <h1 style="margin: 0; color: #333;">${formTitle}</h1>
        <div style="color: #666; margin-top: 5px;">
          Patient: ${patientName || 'Anonymous'}<br>
          Date: ${submittedDate ? new Date(submittedDate).toLocaleDateString() : new Date().toLocaleDateString()}
        </div>
      </div>
    `;
    
    // Insert header at the beginning
    if (flattenedSchema.pages[0].elements.length > 0) {
      flattenedSchema.pages[0].elements.unshift({
        type: 'html',
        name: 'header',
        html: headerHtml
      });
    }
    
    // Generate filename
    const patient = patientName || 'Anonymous';
    const date = submittedDate 
      ? new Date(submittedDate).toLocaleDateString().replace(/\//g, '-')
      : new Date().toLocaleDateString().replace(/\//g, '-');
    const filename = `${patient}_${formTitle}_${date}.pdf`.replace(/[^a-z0-9_\-.]/gi, '_');
    
    // Save
    surveyPdf.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error generating flattened PDF:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate PDF'
    };
  }
};