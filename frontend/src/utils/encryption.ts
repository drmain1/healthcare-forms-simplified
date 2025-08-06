import CryptoJS from 'crypto-js';

// Generate a unique encryption key per session
const generateSessionKey = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  return CryptoJS.SHA256(`${timestamp}-${random}`).toString();
};

// Store the session key in memory only (not in localStorage for security)
let sessionKey: string | null = null;

export const initializeEncryption = (): void => {
  if (!sessionKey) {
    sessionKey = generateSessionKey();
  }
};

export const encryptData = (data: any): string => {
  if (!sessionKey) {
    initializeEncryption();
  }
  
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, sessionKey!).toString();
    return encrypted;
  } catch (error) {
    throw new Error('Failed to encrypt sensitive data');
  }
};

export const decryptData = <T>(encryptedData: string): T => {
  if (!sessionKey) {
    throw new Error('Encryption not initialized');
  }
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, sessionKey).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt sensitive data');
  }
};

// Secure memory cleanup
export const clearEncryptionKey = (): void => {
  sessionKey = null;
};

// Utility to check if data contains PHI fields
export const containsPHI = (data: any): boolean => {
  if (!data) return false;
  
  const phiFields = [
    'ssn', 'socialSecurityNumber',
    'dateOfBirth', 'dob',
    'medicalRecordNumber', 'mrn',
    'insuranceNumber', 'policyNumber',
    'patientName', 'firstName', 'lastName',
    'address', 'phoneNumber', 'email',
    'diagnosis', 'medication', 'treatment',
    'emergencyContact'
  ];
  
  const dataString = JSON.stringify(data).toLowerCase();
  return phiFields.some(field => dataString.includes(field.toLowerCase()));
};

// Mask PHI for display purposes
export const maskPHI = (value: string, type: 'ssn' | 'mrn' | 'phone' | 'email' | 'default' = 'default'): string => {
  if (!value) return '';
  
  switch (type) {
    case 'ssn':
      // Show only last 4 digits: ***-**-1234
      return value.replace(/^(\d{3})-?(\d{2})-?(\d{4})$/, '***-**-$3');
    
    case 'mrn':
      // Show first and last 2 characters: AB****YZ
      if (value.length > 4) {
        return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
      }
      return '*'.repeat(value.length);
    
    case 'phone':
      // Show area code and last 4: (123) ***-5678
      return value.replace(/^(\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?(\d{4})$/, '$1 ***-$2');
    
    case 'email':
      // Show first letter and domain: j****@example.com
      const [localPart, domain] = value.split('@');
      if (localPart && domain) {
        return localPart[0] + '*'.repeat(localPart.length - 1) + '@' + domain;
      }
      return value;
    
    default:
      // Show first and last character
      if (value.length > 2) {
        return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
      }
      return '*'.repeat(value.length);
  }
};