import React, { useState, useEffect } from 'react';
import { Question, Serializer } from 'survey-core';
import { SurveyQuestionElementBase, ReactQuestionFactory } from 'survey-react-ui';
import { designTokens } from '../../styles/design-tokens';
import '../../styles/height-weight-slider.css';

// Height Slider Component
export const HeightSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
}> = ({ value = 66, onChange, readOnly = false }) => {
  const [height, setHeight] = useState(value);

  useEffect(() => {
    setHeight(value);
  }, [value]);

  const handleChange = (newValue: number) => {
    setHeight(newValue);
    onChange(newValue);
  };

  const formatHeight = (inches: number) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  };

  return (
    <div className="tw-p-4 tw-bg-gray-100 tw-rounded-lg">
      <div className="tw-text-3xl tw-font-bold tw-text-center tw-mb-5 tw-text-primary-700">
        {formatHeight(height)}
      </div>
      <input
        type="range"
        min={48}
        max={80}
        value={height}
        onChange={(e) => handleChange(Number(e.target.value))}
        disabled={readOnly}
        className={`tw-w-full tw-h-2 tw-rounded tw-bg-gray-300 tw-outline-none tw-appearance-none ${
          readOnly ? 'tw-cursor-not-allowed' : 'tw-cursor-pointer'
        }`}
        style={{
          background: `linear-gradient(to right, ${designTokens.colors.primary.main} 0%, ${designTokens.colors.primary.main} ${((height - 48) / (80 - 48)) * 100}%, #ddd ${((height - 48) / (80 - 48)) * 100}%, #ddd 100%)`
        }}
      />
      <div className="tw-flex tw-justify-between tw-mt-2 tw-text-xs tw-text-gray-600">
        <span>4'0"</span>
        <span>5'0"</span>
        <span>5'8"</span>
        <span>6'2"</span>
        <span>6'8"</span>
      </div>
      <div className="tw-text-center tw-mt-3 tw-text-sm tw-text-gray-600">
        {height} inches
      </div>
    </div>
  );
};

// Weight Slider Component
export const WeightSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
}> = ({ value = 150, onChange, readOnly = false }) => {
  const [weight, setWeight] = useState(value);

  useEffect(() => {
    setWeight(value);
  }, [value]);

  const handleChange = (newValue: number) => {
    setWeight(newValue);
    onChange(newValue);
  };

  return (
    <div className="tw-p-4 tw-bg-gray-100 tw-rounded-lg">
      <div className="tw-text-3xl tw-font-bold tw-text-center tw-mb-5 tw-text-primary-700">
        {weight} lbs
      </div>
      <input
        type="range"
        min={50}
        max={500}
        value={weight}
        onChange={(e) => handleChange(Number(e.target.value))}
        disabled={readOnly}
        className={`tw-w-full tw-h-2 tw-rounded tw-bg-gray-300 tw-outline-none tw-appearance-none ${
          readOnly ? 'tw-cursor-not-allowed' : 'tw-cursor-pointer'
        }`}
        style={{
          background: `linear-gradient(to right, ${designTokens.colors.primary.main} 0%, ${designTokens.colors.primary.main} ${((weight - 50) / (500 - 50)) * 100}%, #ddd ${((weight - 50) / (500 - 50)) * 100}%, #ddd 100%)`
        }}
      />
      <div className="tw-flex tw-justify-between tw-mt-2 tw-text-xs tw-text-gray-600">
        <span>50 lbs</span>
        <span>150 lbs</span>
        <span>250 lbs</span>
        <span>350 lbs</span>
        <span>500 lbs</span>
      </div>
    </div>
  );
};

// Question Model for Height Slider
export class QuestionHeightSliderModel extends Question {
  static readonly typeName = 'heightslider';

  getType(): string {
    return QuestionHeightSliderModel.typeName;
  }

  get value() {
    return this.getPropertyValue('value', 66);
  }

  set value(newValue: any) {
    this.setPropertyValue('value', newValue);
  }

  public getDisplayValue(keysAsText: boolean, value?: any): any {
    const inches = value || this.value || 66;
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}" (${inches} inches)`;
  }
}

// Question Model for Weight Slider
export class QuestionWeightSliderModel extends Question {
  static readonly typeName = 'weightslider';

  getType(): string {
    return QuestionWeightSliderModel.typeName;
  }

  get value() {
    return this.getPropertyValue('value', 150);
  }

  set value(newValue: any) {
    this.setPropertyValue('value', newValue);
  }

  public getDisplayValue(keysAsText: boolean, value?: any): any {
    const weight = value || this.value || 150;
    return `${weight} pounds`;
  }
}

// Register Height Slider Question Type
Serializer.addClass(
  QuestionHeightSliderModel.typeName,
  [],
  function() {
    return new QuestionHeightSliderModel('');
  },
  'question'
);

// Register Weight Slider Question Type
Serializer.addClass(
  QuestionWeightSliderModel.typeName,
  [],
  function() {
    return new QuestionWeightSliderModel('');
  },
  'question'
);

// React Component for Height Slider Question
export class SurveyQuestionHeightSlider extends SurveyQuestionElementBase {
  get question(): QuestionHeightSliderModel {
    return this.questionBase as QuestionHeightSliderModel;
  }

  protected renderElement(): JSX.Element {
    return (
      <HeightSlider
        value={this.question.value}
        onChange={(value) => {
          this.question.value = value;
        }}
        readOnly={this.question.isReadOnly}
      />
    );
  }
}

// React Component for Weight Slider Question
export class SurveyQuestionWeightSlider extends SurveyQuestionElementBase {
  get question(): QuestionWeightSliderModel {
    return this.questionBase as QuestionWeightSliderModel;
  }

  protected renderElement(): JSX.Element {
    return (
      <WeightSlider
        value={this.question.value}
        onChange={(value) => {
          this.question.value = value;
        }}
        readOnly={this.question.isReadOnly}
      />
    );
  }
}

// Register React Components
ReactQuestionFactory.Instance.registerQuestion(
  QuestionHeightSliderModel.typeName,
  (props: any) => {
    return React.createElement(SurveyQuestionHeightSlider, props);
  }
);

ReactQuestionFactory.Instance.registerQuestion(
  QuestionWeightSliderModel.typeName,
  (props: any) => {
    return React.createElement(SurveyQuestionWeightSlider, props);
  }
);