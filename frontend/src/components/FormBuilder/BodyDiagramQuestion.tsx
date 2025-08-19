import React from 'react';
import { Question, Serializer } from 'survey-core';
import { ReactQuestionFactory, SurveyQuestionElementBase } from 'survey-react-ui';
import { BodyDiagramField } from './BodyDiagramField';

// Define the custom question type
export class QuestionBodyDiagramModel extends Question {
  getType() {
    return 'bodydiagram';
  }

  get painPoints() {
    return this.getPropertyValue('painPoints', []);
  }

  set painPoints(val) {
    this.setPropertyValue('painPoints', val);
  }

  protected onCheckForErrors(errors: any[], isOnValueChanged: boolean, res: any) {
    super.onCheckForErrors(errors, isOnValueChanged, res);
    
    if (this.isRequired && (!this.painPoints || this.painPoints.length === 0)) {
      errors.push({
        text: this.requiredErrorText || 'Please mark at least one pain location'
      });
    }
  }

  protected setQuestionValue(newValue: any, updateIsAnswered: boolean = true) {
    super.setQuestionValue(newValue, updateIsAnswered);
    this.painPoints = newValue;
  }

  protected getQuestionValue() {
    return this.painPoints;
  }
}

// Register the question type
Serializer.addClass(
  'bodydiagram',
  [
    {
      name: 'painPoints:painpoints',
      default: []
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
    return new QuestionBodyDiagramModel('');
  },
  'question'
);

// React component for the question
export class SurveyQuestionBodyDiagram extends SurveyQuestionElementBase {
  constructor(props: any) {
    super(props);
    this.handleValueChange = this.handleValueChange.bind(this);
  }

  get question(): QuestionBodyDiagramModel {
    return this.questionBase as QuestionBodyDiagramModel;
  }

  handleValueChange(value: any) {
    this.question.painPoints = value;
    this.question.value = value;
  }

  renderElement() {
    return (
      <BodyDiagramField
        value={this.question.painPoints}
        onChange={this.handleValueChange}
        readOnly={this.question.isReadOnly}
      />
    );
  }
}

// Register React component
ReactQuestionFactory.Instance.registerQuestion('bodydiagram', (props) => {
  return React.createElement(SurveyQuestionBodyDiagram, props);
});