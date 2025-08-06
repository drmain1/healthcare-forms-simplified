import { GoogleGenerativeAI } from '@google/generative-ai';

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

class InsuranceCardGeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    // Use the same API key as the existing Gemini service
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('No Gemini API key found. Insurance card processing will not work.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro'
    });
  }

  async parseInsuranceCard(imageFile: File, side: 'front' | 'back'): Promise<InsuranceCardData> {
    try {
      // Convert file to base64
      const base64Image = await this.fileToBase64(imageFile);

      const prompt = `
You are an expert at extracting information from health insurance cards. 
Analyze this ${side} side of an insurance card and extract the following information if present:

- Member ID (policy number)
- Member Name
- Group Number
- Insurance Company Name (issuer)
- Plan Type (PPO, HMO, EPO, etc.)
- RX BIN (prescription benefit ID)
- RX PCN (processor control number)
- RX Group
- Copayments:
  - Primary Care Physician (PCP)
  - Specialist
  - Emergency Room
- Annual Deductible
- Out-of-Pocket Maximum
- Effective Date
- Customer Service Phone Number

Return the data in this exact JSON format (use null for missing fields):
{
  "memberId": "extracted value or null",
  "memberName": "extracted value or null",
  "groupNumber": "extracted value or null",
  "issuerName": "extracted value or null",
  "planType": "extracted value or null",
  "rxBin": "extracted value or null",
  "rxPcn": "extracted value or null",
  "rxGroup": "extracted value or null",
  "copayPcp": "extracted value or null",
  "copaySpecialist": "extracted value or null",
  "copayEmergency": "extracted value or null",
  "deductible": "extracted value or null",
  "outOfPocketMax": "extracted value or null",
  "effectiveDate": "extracted value or null",
  "customerServicePhone": "extracted value or null"
}

IMPORTANT: Return ONLY the JSON object, no other text.`;

      // Create the image part for Gemini
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: imageFile.type || 'image/jpeg'
        }
      };

      // Call Gemini API
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          return this.cleanExtractedData(parsedData);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        console.log('Raw response:', text);
        return {};
      }
    } catch (error) {
      
      throw new Error('Failed to process insurance card');
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

  private cleanExtractedData(data: any): InsuranceCardData {
    const cleaned: InsuranceCardData = {};
    
    // Map and clean the extracted data
    if (data.memberId && data.memberId !== 'null') cleaned.memberId = data.memberId;
    if (data.memberName && data.memberName !== 'null') cleaned.memberName = data.memberName;
    if (data.groupNumber && data.groupNumber !== 'null') cleaned.groupNumber = data.groupNumber;
    if (data.issuerName && data.issuerName !== 'null') cleaned.issuerName = data.issuerName;
    if (data.planType && data.planType !== 'null') cleaned.planType = data.planType;
    if (data.rxBin && data.rxBin !== 'null') cleaned.rxBin = data.rxBin;
    if (data.rxPcn && data.rxPcn !== 'null') cleaned.rxPcn = data.rxPcn;
    if (data.rxGroup && data.rxGroup !== 'null') cleaned.rxGroup = data.rxGroup;
    if (data.copayPcp && data.copayPcp !== 'null') cleaned.copayPcp = data.copayPcp;
    if (data.copaySpecialist && data.copaySpecialist !== 'null') cleaned.copaySpecialist = data.copaySpecialist;
    if (data.copayEmergency && data.copayEmergency !== 'null') cleaned.copayEmergency = data.copayEmergency;
    if (data.deductible && data.deductible !== 'null') cleaned.deductible = data.deductible;
    if (data.outOfPocketMax && data.outOfPocketMax !== 'null') cleaned.outOfPocketMax = data.outOfPocketMax;
    if (data.effectiveDate && data.effectiveDate !== 'null') cleaned.effectiveDate = data.effectiveDate;
    if (data.customerServicePhone && data.customerServicePhone !== 'null') cleaned.customerServicePhone = data.customerServicePhone;

    return cleaned;
  }
}

export default new InsuranceCardGeminiService();