import { SurveyPDF, IDocOptions } from 'survey-pdf';
import { Model } from 'survey-core';
import { generateFlattenedPdf } from './pdfExportFlattened';

/**
 * Default PDF document options for healthcare forms
 */
export const defaultPdfOptions: IDocOptions = {
  fontSize: 12,
  format: 'letter', // Letter size
  margins: {
    left: 10,
    right: 10,
    top: 10,
    bot: 10
  },
  fontName: 'Helvetica',
  compress: false, // Disable compression to avoid potential issues
  orientation: 'p' // Portrait mode
};

/**
 * Healthcare-specific PDF options with header/footer
 */
export const healthcarePdfOptions: IDocOptions = {
  ...defaultPdfOptions,
  fontSize: 11,
  margins: {
    left: 15,
    right: 15,
    top: 25,
    bot: 15
  }
};

/**
 * Generate a PDF from a SurveyJS form response
 * @param formSchema - The SurveyJS form schema
 * @param responseData - The response data object
 * @param formTitle - The form title
 * @param patientName - The patient name (optional)
 * @param submittedDate - The submission date (optional)
 * @param options - Custom PDF options (optional)
 */
export const generateResponsePdf = (
  formSchema: any,
  responseData: any,
  formTitle: string,
  patientName?: string,
  submittedDate?: Date | string,
  options?: IDocOptions
): { success: boolean; filename?: string; error?: string; warning?: string } => {
  try {
    // Use provided options or default healthcare options
    const pdfOptions = options || { ...healthcarePdfOptions };
    
    // Clean up the form schema to avoid layout issues
    const cleanSchema = JSON.parse(JSON.stringify(formSchema));
    
    // Ensure all questions have proper sizing and prevent page breaks
    if (cleanSchema.pages) {
      cleanSchema.pages.forEach((page: any) => {
        if (page.elements) {
          page.elements.forEach((element: any) => {
            // Remove any width properties that might cause layout issues
            delete element.width;
            delete element.minWidth;
            delete element.maxWidth;
            delete element.startWithNewLine;
            
            // Ensure elements don't force new pages
            element.readOnly = false;
            
            // For matrix questions, ensure they don't break
            if (element.type === 'matrix' || element.type === 'matrixdynamic' || element.type === 'matrixdropdown') {
              element.allowRowsDragAndDrop = false;
              element.verticalAlign = 'top';
            }
            
            // Ensure proper question layout for panels
            if (element.type === 'panel' && element.elements) {
              element.elements.forEach((subElement: any) => {
                delete subElement.width;
                delete subElement.minWidth;
                delete subElement.maxWidth;
                delete subElement.startWithNewLine;
                subElement.readOnly = false;
              });
            }
            
            // For file upload questions, just show the filename
            if (element.type === 'file') {
              element.storeDataAsText = true;
              element.maxSize = 0; // Don't render file preview
            }
          });
        }
      });
    }
    
    // Ensure the survey itself has proper settings
    cleanSchema.showProgressBar = false;
    cleanSchema.showQuestionNumbers = 'off';
    cleanSchema.questionErrorLocation = 'bottom';
    
    // Create PDF generator instance with cleaned schema
    const surveyPdf = new SurveyPDF(cleanSchema, pdfOptions);
    
    // Set the response data
    surveyPdf.data = responseData;
    
    // Add metadata to the PDF
    surveyPdf.docTitle = formTitle;
    
    // Configure PDF rendering to prevent excessive pages
    surveyPdf.onRenderQuestion.add((_, options) => {
      // Ensure questions don't create new pages
      options.bricks = options.bricks.filter((brick: any) => brick.type !== 'pagebreak');
    });
    
    // Generate filename
    const patient = patientName || 'Anonymous';
    const date = submittedDate 
      ? new Date(submittedDate).toLocaleDateString().replace(/\//g, '-')
      : new Date().toLocaleDateString().replace(/\//g, '-');
    const filename = `${patient}_${formTitle}_${date}.pdf`.replace(/[^a-z0-9_\-.]/gi, '_');
    
    // Save the PDF with error handling
    try {
      surveyPdf.save(filename);
      return { success: true, filename };
    } catch (saveError) {
      console.error('Error saving PDF:', saveError);
      // If save fails, try with minimal options
      const minimalPdf = new SurveyPDF(cleanSchema, defaultPdfOptions);
      minimalPdf.data = responseData;
      minimalPdf.save(filename);
      return { success: true, filename };
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Try flattened PDF approach
    try {
      console.log('Attempting flattened PDF generation...');
      const flattenedResult = generateFlattenedPdf(
        formSchema,
        responseData,
        formTitle,
        patientName,
        submittedDate
      );
      
      if (flattenedResult.success) {
        return { 
          ...flattenedResult, 
          warning: 'Generated optimized PDF format due to form complexity' 
        };
      }
      
      throw new Error(flattenedResult.error || 'Flattened PDF generation failed');
    } catch (flattenedError) {
      console.error('Flattened PDF generation also failed:', flattenedError);
      
      // Final fallback - just create a simple text PDF
      try {
        const fallbackOptions: IDocOptions = {
          fontSize: 12,
          format: 'letter',
          margins: {
            left: 20,
            right: 20,
            top: 20,
            bot: 20
          },
          compress: false
        };
        
        const minimalSchema = {
          title: formTitle,
          pages: [{
            name: 'page1',
            elements: [{
              type: 'comment',
              name: 'response_data',
              title: 'Form Response Data',
              defaultValue: JSON.stringify(responseData, null, 2)
            }]
          }]
        };
        
        const fallbackPdf = new SurveyPDF(minimalSchema, fallbackOptions);
        fallbackPdf.data = { response_data: JSON.stringify(responseData, null, 2) };
        
        const patient = patientName || 'Anonymous';
        const date = submittedDate 
          ? new Date(submittedDate).toLocaleDateString().replace(/\//g, '-')
          : new Date().toLocaleDateString().replace(/\//g, '-');
        const filename = `${patient}_${formTitle}_${date}_text.pdf`.replace(/[^a-z0-9_\-.]/gi, '_');
        
        fallbackPdf.save(filename);
        
        return { success: true, filename, warning: 'Generated text-only PDF due to form complexity' };
      } catch (finalError) {
        console.error('All PDF generation attempts failed:', finalError);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  }
};

/**
 * Generate a blank PDF form template (no response data)
 * @param formSchema - The SurveyJS form schema
 * @param formTitle - The form title
 * @param options - Custom PDF options (optional)
 */
export const generateBlankFormPdf = (
  formSchema: any,
  formTitle: string,
  options?: IDocOptions
): { success: boolean; filename?: string; error?: string } => {
  try {
    const pdfOptions = options || defaultPdfOptions;
    
    // Create PDF generator instance
    const surveyPdf = new SurveyPDF(formSchema, pdfOptions);
    
    // Don't set any data - this creates a blank form
    
    // Add metadata
    surveyPdf.docTitle = `${formTitle} - Blank Template`;
    
    // Generate filename
    const filename = `${formTitle}_Blank_Template.pdf`.replace(/[^a-z0-9_\-.]/gi, '_');
    
    // Save the PDF
    surveyPdf.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error generating blank form PDF:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Convert form response data to a printable format
 * Useful for creating custom PDF layouts
 */
export const formatResponseDataForPrint = (
  formSchema: any,
  responseData: any
): Array<{ question: string; answer: string; type: string }> => {
  const formattedData: Array<{ question: string; answer: string; type: string }> = [];
  
  // Parse the form schema to get questions
  const survey = new Model(formSchema);
  
  survey.getAllQuestions().forEach(question => {
    const answer = responseData[question.name];
    
    if (answer !== undefined && answer !== null && answer !== '') {
      let formattedAnswer = '';
      
      // Format answer based on question type
      switch (question.getType()) {
        case 'checkbox':
          formattedAnswer = Array.isArray(answer) ? answer.join(', ') : String(answer);
          break;
        case 'radiogroup':
        case 'dropdown':
          formattedAnswer = String(answer);
          break;
        case 'text':
        case 'comment':
          formattedAnswer = String(answer);
          break;
        case 'rating':
          formattedAnswer = `${answer} out of ${(question as any).rateMax || 5}`;
          break;
        case 'boolean':
          formattedAnswer = answer ? 'Yes' : 'No';
          break;
        case 'matrix':
        case 'matrixdynamic':
          formattedAnswer = JSON.stringify(answer, null, 2);
          break;
        default:
          formattedAnswer = String(answer);
      }
      
      formattedData.push({
        question: question.title || question.name,
        answer: formattedAnswer,
        type: question.getType()
      });
    }
  });
  
  return formattedData;
};