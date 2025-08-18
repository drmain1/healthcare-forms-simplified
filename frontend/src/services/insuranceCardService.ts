import { firebaseAuth } from './firebaseAuth';

interface InsuranceCardData {
  memberId?: string;
  memberName?: string;
  groupNumber?: string;
  issuerName?: string;
  planType?: string;
  rxBin?: string;
  rxPcn?: string;
  rxGroup?: string;
  copayPcp?: string;
  copaySpecialist?: string;
  copayEmergency?: string;
  deductible?: string;
  outOfPocketMax?: string;
  effectiveDate?: string;
  customerServicePhone?: string;
}

class InsuranceCardService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
  }

  async parseInsuranceCard(imageFile: File, side: 'front' | 'back'): Promise<InsuranceCardData> {
    console.log('=== InsuranceCardService.parseInsuranceCard ===');
    console.log('Processing file:', imageFile.name, 'Size:', imageFile.size, 'Type:', imageFile.type);
    console.log('Side:', side);
    
    try {
      // Convert file to base64
      const base64Image = await this.fileToBase64(imageFile);
      console.log('Base64 image length:', base64Image.length);

      // Get auth token
      const token = await firebaseAuth.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      console.log('Got auth token');

      // Prepare request body
      const requestBody = {
        imageData: base64Image,
        side: side,
        mimeType: imageFile.type || 'image/jpeg'
      };
      console.log('Request body prepared, calling API...');

      // Call backend API
      const apiUrl = `${this.apiUrl}/insurance-card/extract`;
      console.log('API URL:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to process insurance card: ${response.statusText}`);
      }

      const extractedData = await response.json();
      return this.cleanExtractedData(extractedData);
    } catch (error) {
      console.error('Error processing insurance card:', error);
      throw error;
    }
  }

  async parseInsuranceCardWithFile(imageFile: File, side: 'front' | 'back'): Promise<InsuranceCardData> {
    try {
      // Get auth token
      const token = await firebaseAuth.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('side', side);

      // Call backend API with multipart form
      const response = await fetch(`${this.apiUrl}/insurance-card/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to process insurance card: ${response.statusText}`);
      }

      const extractedData = await response.json();
      return this.cleanExtractedData(extractedData);
    } catch (error) {
      console.error('Error processing insurance card:', error);
      throw error;
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  private cleanExtractedData(data: any): InsuranceCardData {
    const cleaned: any = {};
    
    // Preserve both camelCase keys (for frontend/AI) and snake_case keys (for backend PDF rendering)
    if (data.memberId && data.memberId !== 'null') {
      cleaned.memberId = data.memberId;
      cleaned.insurance_member_id = data.memberId;
    }
    if (data.memberName && data.memberName !== 'null') {
      cleaned.memberName = data.memberName;
      cleaned.insurance_member_name = data.memberName;
    }
    if (data.groupNumber && data.groupNumber !== 'null') {
      cleaned.groupNumber = data.groupNumber;
      cleaned.insurance_group_number = data.groupNumber;
    }
    if (data.issuerName && data.issuerName !== 'null') {
      cleaned.issuerName = data.issuerName;
      cleaned.insurance_issuer_name = data.issuerName;
    }
    if (data.planType && data.planType !== 'null') {
      cleaned.planType = data.planType;
      cleaned.insurance_plan_type = data.planType;
    }
    if (data.rxBin && data.rxBin !== 'null') {
      cleaned.rxBin = data.rxBin;
      cleaned.insurance_rx_bin = data.rxBin;
    }
    if (data.rxPcn && data.rxPcn !== 'null') {
      cleaned.rxPcn = data.rxPcn;
      cleaned.insurance_rx_pcn = data.rxPcn;
    }
    if (data.rxGroup && data.rxGroup !== 'null') {
      cleaned.rxGroup = data.rxGroup;
      cleaned.insurance_rx_group = data.rxGroup;
    }
    if (data.copayPcp && data.copayPcp !== 'null') {
      cleaned.copayPcp = data.copayPcp;
      cleaned.insurance_copay_pcp = data.copayPcp;
    }
    if (data.copaySpecialist && data.copaySpecialist !== 'null') {
      cleaned.copaySpecialist = data.copaySpecialist;
      cleaned.insurance_copay_specialist = data.copaySpecialist;
    }
    if (data.copayEmergency && data.copayEmergency !== 'null') {
      cleaned.copayEmergency = data.copayEmergency;
      cleaned.insurance_copay_emergency = data.copayEmergency;
    }
    if (data.deductible && data.deductible !== 'null') {
      cleaned.deductible = data.deductible;
      cleaned.insurance_deductible = data.deductible;
    }
    if (data.outOfPocketMax && data.outOfPocketMax !== 'null') {
      cleaned.outOfPocketMax = data.outOfPocketMax;
      cleaned.insurance_oop_max = data.outOfPocketMax;
    }
    if (data.effectiveDate && data.effectiveDate !== 'null') {
      cleaned.effectiveDate = data.effectiveDate;
      cleaned.insurance_effective_date = data.effectiveDate;
    }
    if (data.customerServicePhone && data.customerServicePhone !== 'null') {
      cleaned.customerServicePhone = data.customerServicePhone;
      cleaned.insurance_customer_service_phone = data.customerServicePhone;
    }

    return cleaned as InsuranceCardData;
  }
}

export default new InsuranceCardService();