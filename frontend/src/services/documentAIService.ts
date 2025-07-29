import axios from 'axios';

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

interface DocumentAIResponse {
  document: {
    entities: Array<{
      type: string;
      mentionText: string;
      confidence: number;
    }>;
    text: string;
  };
}

class DocumentAIService {
  private apiEndpoint: string;
  private projectId: string;
  private location: string;
  private processorId: string;

  constructor() {
    // These would typically come from environment variables
    this.apiEndpoint = process.env.REACT_APP_GCP_DOCUMENT_AI_ENDPOINT || '';
    this.projectId = process.env.REACT_APP_GCP_PROJECT_ID || '';
    this.location = process.env.REACT_APP_GCP_LOCATION || 'us';
    this.processorId = process.env.REACT_APP_GCP_HEALTH_INSURANCE_PROCESSOR_ID || '';
  }

  async parseInsuranceCard(imageFile: File, side: 'front' | 'back'): Promise<InsuranceCardData> {
    try {
      // Convert file to base64
      const base64Image = await this.fileToBase64(imageFile);

      // Prepare the request to Document AI
      const requestBody = {
        rawDocument: {
          content: base64Image,
          mimeType: imageFile.type
        }
      };

      // Call Document AI API
      const response = await axios.post<DocumentAIResponse>(
        `${this.apiEndpoint}/v1/projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}:process`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Parse the response and extract insurance card data
      return this.extractInsuranceData(response.data, side);
    } catch (error) {
      console.error('Error parsing insurance card:', error);
      throw new Error('Failed to parse insurance card');
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Content = base64.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = error => reject(error);
    });
  }

  private async getAccessToken(): Promise<string> {
    // In a real implementation, this would get the access token from your auth service
    // For now, returning a placeholder
    return process.env.REACT_APP_GCP_ACCESS_TOKEN || '';
  }

  private extractInsuranceData(response: DocumentAIResponse, side: 'front' | 'back'): InsuranceCardData {
    const entities = response.document.entities || [];
    const data: InsuranceCardData = {};

    // Map Document AI entity types to our data structure
    entities.forEach(entity => {
      const value = entity.mentionText.trim();
      
      switch (entity.type) {
        case 'member_id':
          data.memberId = value;
          break;
        case 'member_name':
          data.memberName = value;
          break;
        case 'group_number':
          data.groupNumber = value;
          break;
        case 'issuer_name':
          data.issuerName = value;
          break;
        case 'plan_type':
          data.planType = value;
          break;
        case 'rx_bin':
          data.rxBin = value;
          break;
        case 'rx_pcn':
          data.rxPcn = value;
          break;
        case 'rx_group':
          data.rxGroup = value;
          break;
        case 'effective_date':
          data.effectiveDate = value;
          break;
        case 'customer_service_phone':
          data.customerServicePhone = value;
          break;
        // Handle copay information
        case 'copay_pcp':
        case 'copay_primary_care':
          data.copayPcp = value;
          break;
        case 'copay_specialist':
          data.copaySpecialist = value;
          break;
        case 'copay_emergency':
          data.copayEmergency = value;
          break;
        // Handle deductibles and limits
        case 'deductible':
        case 'annual_deductible':
          data.deductible = value;
          break;
        case 'out_of_pocket_max':
        case 'oop_max':
          data.outOfPocketMax = value;
          break;
      }
    });

    return data;
  }

  // Alternative method using generic Document AI (if health insurance processor is not available)
  async parseInsuranceCardGeneric(imageFile: File): Promise<InsuranceCardData> {
    try {
      const base64Image = await this.fileToBase64(imageFile);

      // Use OCR processor instead
      const requestBody = {
        rawDocument: {
          content: base64Image,
          mimeType: imageFile.type
        }
      };

      // This would use a generic OCR processor
      const response = await axios.post(
        `${this.apiEndpoint}/v1/projects/${this.projectId}/locations/${this.location}/processors/${process.env.REACT_APP_GCP_OCR_PROCESSOR_ID}:process`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract text and use regex patterns to find insurance data
      const text = response.data.document.text;
      return this.extractInsuranceDataFromText(text);
    } catch (error) {
      console.error('Error with generic parsing:', error);
      throw new Error('Failed to parse insurance card with OCR');
    }
  }

  private extractInsuranceDataFromText(text: string): InsuranceCardData {
    const data: InsuranceCardData = {};

    // Common patterns for insurance card data
    const patterns = {
      memberId: /(?:Member ID|ID|Member#?):?\s*([A-Z0-9]+)/i,
      groupNumber: /(?:Group|Group#?|Grp):?\s*([A-Z0-9]+)/i,
      rxBin: /(?:RxBIN|BIN):?\s*(\d+)/i,
      rxPcn: /(?:RxPCN|PCN):?\s*([A-Z0-9]+)/i,
      rxGroup: /(?:RxGRP|RxGroup):?\s*([A-Z0-9]+)/i,
      memberName: /(?:Member Name|Name):?\s*([A-Za-z\s]+)/i,
    };

    // Extract using regex patterns
    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match && match[1]) {
        data[key as keyof InsuranceCardData] = match[1].trim();
      }
    });

    // Look for insurance company names
    const insuranceCompanies = [
      'Blue Cross Blue Shield', 'BCBS', 'Aetna', 'Cigna', 'United Healthcare', 
      'UnitedHealth', 'Humana', 'Kaiser Permanente', 'Anthem', 'Centene'
    ];
    
    const textUpper = text.toUpperCase();
    for (const company of insuranceCompanies) {
      if (textUpper.includes(company.toUpperCase())) {
        data.issuerName = company;
        break;
      }
    }

    return data;
  }
}

export default new DocumentAIService();