import React, { useState, useEffect } from 'react';
import { Question, Serializer } from 'survey-core';
import { SurveyQuestionElementBase, ReactQuestionFactory } from 'survey-react-ui';

// Define the shape of the data for this component
interface IPatientDemographics {
  firstName: string;
  lastName: string;
  preferredName: string;
  dob: string;
  email: string;
  primaryPhone: string;
  secondaryPhone: string;
  cellPhone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

const defaultDemographics: IPatientDemographics = {
  firstName: '',
  lastName: '',
  preferredName: '',
  dob: '',
  email: '',
  primaryPhone: '',
  secondaryPhone: '',
  cellPhone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
};

// --- React Component ---
const PatientDemographicsComponent: React.FC<{
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
}> = ({ value, onChange, readOnly }) => {
  const [data, setData] = useState<IPatientDemographics>({ ...defaultDemographics, ...value });

  useEffect(() => {
    // This ensures the component updates if the survey data changes externally
    setData({ ...defaultDemographics, ...value });
  }, [value]);

  const handleChange = (field: keyof IPatientDemographics, fieldValue: string) => {
    const newData = { ...data, [field]: fieldValue };
    setData(newData);
    onChange(newData);
  };
  
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="tw-p-4 tw-border tw-border-gray-300 tw-rounded-lg">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div>
                <label className="tw-block tw-text-sm tw-font-medium">First Name</label>
                <input type="text" value={data.firstName} onChange={e => handleChange('firstName', e.target.value)} disabled={readOnly} className="tw-w-full tw-p-2 tw-border tw-rounded"/>
            </div>
            <div>
                <label className="tw-block tw-text-sm tw-font-medium">Last Name</label>
                <input type="text" value={data.lastName} onChange={e => handleChange('lastName', e.target.value)} disabled={readOnly} className="tw-w-full tw-p-2 tw-border tw-rounded"/>
            </div>
            <div>
                <label className="tw-block tw-text-sm tw-font-medium">Preferred Name</label>
                <input type="text" value={data.preferredName} onChange={e => handleChange('preferredName', e.target.value)} disabled={readOnly} className="tw-w-full tw-p-2 tw-border tw-rounded"/>
            </div>
             <div>
                <label className="tw-block tw-text-sm tw-font-medium">Date of Birth</label>
                <input type="date" value={data.dob} onChange={e => handleChange('dob', e.target.value)} disabled={readOnly} className="tw-w-full tw-p-2 tw-border tw-rounded"/>
            </div>
            <div>
                <label className="tw-block tw-text-sm tw-font-medium">Email</label>
                <input type="email" value={data.email} onChange={e => handleChange('email', e.target.value)} disabled={readOnly} className="tw-w-full tw-p-2 tw-border tw-rounded"/>
            </div>
            <div>
                <label className="tw-block tw-text-sm tw-font-medium">Primary Phone</label>
                <input type="tel" value={data.primaryPhone} onChange={e => handleChange('primaryPhone', e.target.value)} disabled={readOnly} className="tw-w-full tw-p-2 tw-border tw-rounded"/>
            </div>
            <div>
                <label className="tw-block tw-text-sm tw-font-medium">Cell Phone</label>
                <input type="tel" value={data.cellPhone} onChange={e => handleChange('cellPhone', e.target.value)} disabled={readOnly} className="tw-w-full tw-p-2 tw-border tw-rounded"/>
            </div>
            <div>
                <label className="tw-block tw-text-sm tw-font-medium">Address</label>
                <input type="text" value={data.address} onChange={e => handleChange('address', e.target.value)} disabled={readOnly} className="tw-w-full tw-p-2 tw-border tw-rounded"/>
            </div>
            <div>
                <label className="tw-block tw-text-sm tw-font-medium">City</label>
                <input type="text" value={data.city} onChange={e => handleChange('city', e.target.value)} disabled={readOnly} className="tw-w-full tw-p-2 tw-border tw-rounded"/>
            </div>
            <div>
                <label className="tw-block tw-text-sm tw-font-medium">State</label>
                <input type="text" value={data.state} onChange={e => handleChange('state', e.target.value)} disabled={readOnly} className="tw-w-full tw-p-2 tw-border tw-rounded"/>
            </div>
            <div>
                <label className="tw-block tw-text-sm tw-font-medium">Zip Code</label>
                <input type="text" value={data.zip} onChange={e => handleChange('zip', e.target.value)} disabled={readOnly} className="tw-w-full tw-p-2 tw-border tw-rounded"/>
            </div>
             <div className="tw-col-span-full">
                <label className="tw-block tw-text-sm tw-font-medium">Today's Date</label>
                <input type="text" value={today} readOnly className="tw-w-full tw-p-2 tw-border tw-rounded tw-bg-gray-100"/>
            </div>
        </div>
    </div>
  );
};

// --- SurveyJS Question Model ---
export class QuestionPatientDemographicsModel extends Question {
  static readonly typeName = 'patient_demographics';

  getType(): string {
    return QuestionPatientDemographicsModel.typeName;
  }

  get value() {
    return this.getPropertyValue('value', {});
  }

  set value(newValue: any) {
    this.setPropertyValue('value', newValue);
  }
}

// --- Register with SurveyJS ---
Serializer.addClass(
  QuestionPatientDemographicsModel.typeName,
  [], // No special properties to serialize, the value is a single JSON object
  function () {
    return new QuestionPatientDemographicsModel('');
  },
  'question'
);

export class SurveyQuestionPatientDemographics extends SurveyQuestionElementBase {
  get question(): QuestionPatientDemographicsModel {
    return this.questionBase as QuestionPatientDemographicsModel;
  }

  protected renderElement(): JSX.Element {
    return (
      <PatientDemographicsComponent
        value={this.question.value}
        onChange={(newValue) => {
          this.question.value = newValue;
        }}
        readOnly={this.question.isReadOnly}
      />
    );
  }
}

ReactQuestionFactory.Instance.registerQuestion(
  QuestionPatientDemographicsModel.typeName,
  (props) => {
    return React.createElement(SurveyQuestionPatientDemographics, props);
  }
);