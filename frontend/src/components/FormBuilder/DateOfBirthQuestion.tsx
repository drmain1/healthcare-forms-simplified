import React, { useState, useEffect } from 'react';
import { Question, Serializer, SurveyModel } from 'survey-core';
import { SurveyQuestionElementBase, ReactQuestionFactory } from 'survey-react-ui';
import { designTokens } from '../../styles/design-tokens';

// Helper function to calculate age
const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Date of Birth Component
export const DateOfBirthInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}> = ({ value = '', onChange, readOnly = false }) => {
  const [dob, setDob] = useState(value);
  const [age, setAge] = useState(calculateAge(value));

  useEffect(() => {
    setDob(value);
    setAge(calculateAge(value));
  }, [value]);

  const handleDateChange = (newDate: string) => {
    setDob(newDate);
    const newAge = calculateAge(newDate);
    setAge(newAge);
    console.log('[DateOfBirthInput] Date changed:', newDate, 'Age:', newAge);
    onChange(newDate);
  };

  // Format date for display (ensure it's YYYY-MM-DD for input)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  // Get max date (today)
  const maxDate = new Date().toISOString().split('T')[0];
  
  // Get min date (120 years ago)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <div className="tw-p-4 tw-rounded-lg tw-border tw-border-gray-300">
      <div className="tw-mb-4">
        <label className="tw-block tw-mb-2 tw-text-sm tw-font-medium">
          Date of Birth
        </label>
        <input
          type="date"
          value={formatDateForInput(dob)}
          onChange={(e) => handleDateChange(e.target.value)}
          disabled={readOnly}
          max={maxDate}
          min={minDateString}
          className={`tw-w-full tw-p-3 tw-text-base tw-border tw-border-gray-400 tw-rounded ${
            readOnly 
              ? 'tw-cursor-not-allowed' 
              : 'tw-cursor-pointer hover:tw-border-primary-500 focus:tw-border-primary-500 focus:tw-ring-2 focus:tw-ring-primary-200'
          }`}
        />
      </div>
      
      {dob && (
        <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-rounded tw-mt-3 tw-border tw-border-gray-300">
          <span className="tw-text-sm tw-font-medium">
            Calculated Age:
          </span>
          <span className="tw-text-2xl tw-font-bold">
            {age} years
          </span>
        </div>
      )}
      
      {!dob && (
        <div className="tw-p-3 tw-rounded tw-mt-3 tw-text-sm tw-text-center tw-border tw-border-gray-300">
          Please select date of birth to calculate age
        </div>
      )}
    </div>
  );
};

// Question Model for Date of Birth
export class QuestionDateOfBirthModel extends Question {
  static readonly typeName = 'dateofbirth';

  getType(): string {
    return QuestionDateOfBirthModel.typeName;
  }

  get value() {
    const val = this.getPropertyValue('value', '');
    console.log('[DateOfBirth] Getting value:', val, 'for question:', this.name);
    return val;
  }

  set value(newValue: any) {
    console.log('[DateOfBirth] Setting value:', newValue);
    this.setPropertyValue('value', newValue);
    // Also update the calculated age
    if (newValue) {
      const age = calculateAge(newValue);
      console.log('[DateOfBirth] Calculated age:', age);
      this.setPropertyValue('calculatedAge', age);
      this.updateSurveyData(age);
    }
  }

  get calculatedAge() {
    return this.getPropertyValue('calculatedAge', 0);
  }

  private updateSurveyData(age: number) {
    if (this.survey) {
      const ageFieldName = this.getPropertyValue('ageFieldName', 'patient_age');
      console.log('[DateOfBirth] Updating survey data - Age field:', ageFieldName, 'Value:', age);
      (this.survey as SurveyModel).setValue(ageFieldName, age);
      
      // Also make sure the DOB value is set in the survey data
      const dobValue = this.value;
      if (dobValue) {
        console.log('[DateOfBirth] Ensuring DOB is in survey data. Name:', this.name, 'Value:', dobValue);
        (this.survey as SurveyModel).setValue(this.name, dobValue);
      }
    }
  }

  public getDisplayValue(keysAsText: boolean, value?: any): any {
    const dob = value || this.value;
    if (!dob) return 'Not specified';
    
    const date = new Date(dob);
    const age = calculateAge(dob);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `${formattedDate} (Age: ${age})`;
  }

  // Method to get just the age value
  public getAge(): number {
    return this.calculatedAge;
  }

  // Override to include age in the data
  public getPlainData(options?: any): any {
    const data = super.getPlainData(options);
    console.log('[DateOfBirth] getPlainData called. Value:', this.value, 'Age:', this.calculatedAge);
    return {
      ...data,
      value: this.value,
      age: this.calculatedAge
    };
  }
  
  // Override to set age variable when value changes
  protected onValueChanged(): void {
    super.onValueChanged();
    if (this.value) {
      const age = calculateAge(this.value);
      this.setPropertyValue('calculatedAge', age);
      this.updateSurveyData(age);
    }
  }
}

// React Component for Date of Birth Question
export class SurveyQuestionDateOfBirth extends SurveyQuestionElementBase {
  get question(): QuestionDateOfBirthModel {
    return this.questionBase as QuestionDateOfBirthModel;
  }

  protected renderElement(): JSX.Element {
    return (
      <DateOfBirthInput
        value={this.question.value}
        onChange={(value) => {
          console.log('[DateOfBirth Component] Value changed:', value);
          this.question.value = value; // This will trigger the setter and updateSurveyData
        }}
        readOnly={this.question.isReadOnly}
      />
    );
  }
}

// Self-registering function
function registerDateOfBirthQuestion() {
  if (Serializer.findClass(QuestionDateOfBirthModel.typeName)) {
    console.log('[DateOfBirth] Already registered');
    return; // Already registered
  }

  console.log('[DateOfBirth] Registering question type');
  // Register the question type
  Serializer.addClass(
    QuestionDateOfBirthModel.typeName,
    [
      {
        name: 'value',
        default: '',
        category: 'general'
      },
      {
        name: 'includeAge:boolean',
        default: true,
        category: 'general'
      },
      {
        name: 'ageFieldName',
        default: 'patient_age',
        category: 'general'
      },
      {
        name: 'metadata',
        default: null,
        category: 'general',
        visible: false,
        isSerializable: true
      }
    ],
    function() {
      return new QuestionDateOfBirthModel('');
    },
    'question'
  );

  // Register React Component
  ReactQuestionFactory.Instance.registerQuestion(
    QuestionDateOfBirthModel.typeName,
    (props: any) => {
      return React.createElement(SurveyQuestionDateOfBirth, props);
    }
  );
}

// Run registration automatically on import
registerDateOfBirthQuestion();

// Export for use
export default QuestionDateOfBirthModel;