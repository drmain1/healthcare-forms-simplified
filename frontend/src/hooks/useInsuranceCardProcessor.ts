import { useState, useCallback } from 'react';
import { SurveyModel } from 'survey-core';
import documentAIService from '../services/documentAIService';
import insuranceCardGeminiService from '../services/insuranceCardGeminiService';

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
    if (!survey) return;

    setStatus({ isProcessing: true, error: null, processedData: null });

    try {
      // Check if we have Gemini API key
      const hasGeminiKey = !!process.env.REACT_APP_GEMINI_API_KEY;
      const hasHealthInsuranceProcessor = !!process.env.REACT_APP_GCP_HEALTH_INSURANCE_PROCESSOR_ID;
      
      let extractedData;
      if (hasGeminiKey) {
        // Use Gemini for insurance card processing (preferred)
        console.log('Using Gemini API for insurance card processing...');
        extractedData = await insuranceCardGeminiService.parseInsuranceCard(file, side);
      } else if (hasHealthInsuranceProcessor) {
        // Fall back to Document AI if available
        console.log('Using Document AI for insurance card processing...');
        extractedData = await documentAIService.parseInsuranceCard(file, side);
      } else {
        // Fall back to generic OCR
        console.log('Using generic OCR for insurance card processing...');
        extractedData = await documentAIService.parseInsuranceCardGeneric(file);
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to process insurance card';
      setStatus({
        isProcessing: false,
        error: errorMessage,
        processedData: null
      });
      
    }
  }, [survey]);

  return {
    processInsuranceCard,
    isProcessing: status.isProcessing,
    error: status.error,
    processedData: status.processedData
  };
};