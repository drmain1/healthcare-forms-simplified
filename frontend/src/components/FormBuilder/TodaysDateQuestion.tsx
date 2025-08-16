import React, { useState, useEffect } from 'react';
import { Question, Serializer, SurveyModel } from 'survey-core';
import { SurveyQuestionElementBase, ReactQuestionFactory } from 'survey-react-ui';

// Helper function to get today's date in YYYY-MM-DD format
const getTodaysDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Helper function to format date for display
const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Today's Date Component
export const TodaysDateInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  autoPopulate?: boolean;
}> = ({ value = '', onChange, readOnly = false, autoPopulate = true }) => {
  const [date, setDate] = useState(value || (autoPopulate ? getTodaysDate() : ''));

  useEffect(() => {
    // Auto-populate with today's date if enabled and no value exists
    if (autoPopulate && !value) {
      const today = getTodaysDate();
      setDate(today);
      onChange(today);
      console.log('[TodaysDate] Auto-populated with today:', today);
    } else if (value) {
      setDate(value);
    }
  }, [value, autoPopulate, onChange]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    console.log('[TodaysDate] Date changed:', newDate);
    onChange(newDate);
  };

  // Get max date (today)
  const maxDate = getTodaysDate();
  
  // Get min date (1 year ago)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 1);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <div className="tw-p-4 tw-rounded-lg tw-border tw-border-gray-300">
      <div className="tw-mb-4">
        <label className="tw-block tw-mb-2 tw-text-sm tw-font-medium">
          Today's Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          disabled={readOnly}
          max={maxDate}
          min={minDateString}
          className={`tw-w-full tw-p-3 tw-text-base tw-border tw-border-gray-400 tw-rounded ${
            readOnly 
              ? 'tw-bg-gray-100 tw-cursor-not-allowed' 
              : 'tw-cursor-pointer hover:tw-border-primary-500 focus:tw-border-primary-500 focus:tw-ring-2 focus:tw-ring-primary-200'
          }`}
        />
      </div>
      
      {date && (
        <div className="tw-p-3 tw-rounded tw-bg-blue-50 tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <span className="tw-text-sm tw-font-medium tw-text-blue-900">
              Formatted Date:
            </span>
            <span className="tw-text-sm tw-font-bold tw-text-blue-900">
              {formatDateForDisplay(date)}
            </span>
          </div>
        </div>
      )}
      
      {!date && (
        <div className="tw-p-3 tw-rounded tw-mt-3 tw-text-sm tw-text-center tw-border tw-border-gray-300">
          Please select a date
        </div>
      )}
    </div>
  );
};

// Question Model for Today's Date
export class QuestionTodaysDateModel extends Question {
  static readonly typeName = 'todaysdate';

  getType(): string {
    return QuestionTodaysDateModel.typeName;
  }

  get value() {
    const val = this.getPropertyValue('value', '');
    console.log('[TodaysDate] Getting value:', val, 'for question:', this.name);
    return val;
  }

  set value(newValue: any) {
    console.log('[TodaysDate] Setting value:', newValue);
    this.setPropertyValue('value', newValue);
  }

  get autoPopulate() {
    return this.getPropertyValue('autoPopulate', true);
  }

  set autoPopulate(val: boolean) {
    this.setPropertyValue('autoPopulate', val);
  }

  protected onCreated() {
    super.onCreated();
    // Auto-populate with today's date when question is created
    if (this.autoPopulate && !this.value) {
      const today = getTodaysDate();
      console.log('[TodaysDate] Auto-populating on creation:', today);
      this.value = today;
      this.defaultValue = today;
    }
  }

  public onSurveyLoad() {
    super.onSurveyLoad();
    // Auto-populate when survey loads if enabled
    if (this.autoPopulate && !this.value) {
      const today = getTodaysDate();
      console.log('[TodaysDate] Auto-populating on survey load:', today);
      this.value = today;
    }
  }

  public getDisplayValue(keysAsText: boolean, value?: any): any {
    const dateValue = value || this.value;
    if (!dateValue) return 'Not specified';
    
    return formatDateForDisplay(dateValue);
  }

  // Override to include formatted date in the data
  public getPlainData(options?: any): any {
    const data = super.getPlainData(options);
    console.log('[TodaysDate] getPlainData called. Value:', this.value);
    return {
      ...data,
      value: this.value,
      formatted: formatDateForDisplay(this.value)
    };
  }
}

// React Component for Today's Date Question
export class SurveyQuestionTodaysDate extends SurveyQuestionElementBase {
  get question(): QuestionTodaysDateModel {
    return this.questionBase as unknown as QuestionTodaysDateModel;
  }

  protected renderElement(): JSX.Element {
    return (
      <TodaysDateInput
        value={this.question.value}
        onChange={(value) => {
          console.log('[TodaysDate Component] Value changed:', value);
          this.question.value = value;
        }}
        readOnly={this.question.isReadOnly}
        autoPopulate={this.question.autoPopulate}
      />
    );
  }
}

// Self-registering function
function registerTodaysDateQuestion() {
  if (Serializer.findClass(QuestionTodaysDateModel.typeName)) {
    console.log('[TodaysDate] Already registered');
    return; // Already registered
  }

  console.log('[TodaysDate] Registering question type');
  // Register the question type
  Serializer.addClass(
    QuestionTodaysDateModel.typeName,
    [
      {
        name: 'value',
        default: '',
        category: 'general'
      },
      {
        name: 'autoPopulate:boolean',
        default: true,
        category: 'general',
        displayName: 'Auto-populate with today\'s date'
      },
      {
        name: 'readOnly:boolean',
        default: false,
        category: 'general',
        displayName: 'Read-only'
      }
    ],
    function() {
      return new QuestionTodaysDateModel('');
    },
    'question'
  );

  // Register React Component
  ReactQuestionFactory.Instance.registerQuestion(
    QuestionTodaysDateModel.typeName,
    (props: any) => {
      return React.createElement(SurveyQuestionTodaysDate, props);
    }
  );
}

// Run registration automatically on import
registerTodaysDateQuestion();

// Export for use
export default QuestionTodaysDateModel;