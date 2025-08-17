import { useState, useCallback } from 'react';
import { SurveyModel } from 'survey-core';
import documentAIService from '../services/documentAIService';
import insuranceCardService from '../services/insuranceCardService';

interface ProcessingStatus {
  isProcessing: boolean;
  error: string | null;
  processedData: any;
}

export const useInsuranceCardProcessor = (survey: SurveyModel | null) => {
  const [status, setStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    error: null,
    processedData: null
  });

  const processInsuranceCard = useCallback(async (file: File, side: 'front' | 'back') => {
    console.log('=== useInsuranceCardProcessor.processInsuranceCard ===');
    console.log('Survey available:', !!survey);
    console.log('File:', file);
    console.log('Side:', side);
    
    if (!survey) {
      console.error('Survey not available, cannot process insurance card');
      return;
    }

    setStatus({ isProcessing: true, error: null, processedData: null });

    try {
      // Use backend API for insurance card processing (Vertex AI with Gemini)
      console.log('Processing insurance card via backend API...');
      const extractedData = await insuranceCardService.parseInsuranceCard(file, side);
      console.log('Extracted data from service:', extractedData);
      
      // Fallback options if needed
      if (!extractedData || Object.keys(extractedData).length === 0) {
        const hasHealthInsuranceProcessor = !!process.env.REACT_APP_GCP_HEALTH_INSURANCE_PROCESSOR_ID;
        
        if (hasHealthInsuranceProcessor) {
          // Fall back to Document AI if available
          console.log('Falling back to Document AI for insurance card processing...');
          const fallbackData = await documentAIService.parseInsuranceCard(file, side);
          Object.assign(extractedData, fallbackData);
        }
      }

      // Update survey fields with extracted data
      if (extractedData.memberId) {
        survey.setValue('insurance_member_id', extractedData.memberId);
      }
      if (extractedData.memberName) {
        survey.setValue('insurance_member_name', extractedData.memberName);
      }
      if (extractedData.groupNumber) {
        survey.setValue('insurance_group_number', extractedData.groupNumber);
      }
      if (extractedData.issuerName) {
        survey.setValue('insurance_issuer_name', extractedData.issuerName);
      }
      if (extractedData.planType) {
        survey.setValue('insurance_plan_type', extractedData.planType);
      }
      if (extractedData.rxBin) {
        survey.setValue('insurance_rx_bin', extractedData.rxBin);
      }
      if (extractedData.rxPcn) {
        survey.setValue('insurance_rx_pcn', extractedData.rxPcn);
      }
      if (extractedData.rxGroup) {
        survey.setValue('insurance_rx_group', extractedData.rxGroup);
      }
      if (extractedData.copayPcp) {
        survey.setValue('insurance_copay_pcp', extractedData.copayPcp);
      }
      if (extractedData.copaySpecialist) {
        survey.setValue('insurance_copay_specialist', extractedData.copaySpecialist);
      }
      if (extractedData.copayEmergency) {
        survey.setValue('insurance_copay_emergency', extractedData.copayEmergency);
      }
      if (extractedData.deductible) {
        survey.setValue('insurance_deductible', extractedData.deductible);
      }
      if (extractedData.outOfPocketMax) {
        survey.setValue('insurance_oop_max', extractedData.outOfPocketMax);
      }
      if (extractedData.effectiveDate) {
        survey.setValue('insurance_effective_date', extractedData.effectiveDate);
      }
      if (extractedData.customerServicePhone) {
        survey.setValue('insurance_customer_service_phone', extractedData.customerServicePhone);
      }

      setStatus({
        isProcessing: false,
        error: null,
        processedData: extractedData
      });

      return extractedData;
    } catch (error) {
      console.error('Error in processInsuranceCard:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process insurance card';
      setStatus({
        isProcessing: false,
        error: errorMessage,
        processedData: null
      });
      throw error; // Re-throw to see it in the calling code
    }
  }, [survey]);

  return {
    processInsuranceCard,
    isProcessing: status.isProcessing,
    error: status.error,
    processedData: status.processedData
  };
};