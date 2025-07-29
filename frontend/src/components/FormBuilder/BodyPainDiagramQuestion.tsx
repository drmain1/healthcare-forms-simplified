import React from 'react';
import { Question, Serializer } from 'survey-core';
import { SurveyQuestionElementBase, ReactQuestionFactory } from 'survey-react-ui';
import { BodyPainDiagram, renderBodyDiagramForPDF } from './BodyPainDiagram';

// Define the custom question model
export class QuestionBodyPainDiagramModel extends Question {
  static readonly typeName = 'bodypaindiagram';

  getType(): string {
    return QuestionBodyPainDiagramModel.typeName;
  }

  get value() {
    return this.getPropertyValue('value', []);
  }

  set value(newValue: any) {
    this.setPropertyValue('value', newValue);
  }

  // Override to handle PDF export
  public getDisplayValue(keysAsText: boolean, value?: any): any {
    const marks = value || this.value || [];
    if (marks.length === 0) return 'No pain areas marked';
    
    // Return a summary for display
    const summary = marks.map((mark: any, index: number) => 
      `Area ${index + 1}: ${mark.intensity} pain`
    ).join(', ');
    
    return summary;
  }

  // Method to get HTML for PDF rendering
  public getHtmlForPDF(): string {
    return renderBodyDiagramForPDF(this.value || []);
  }
}

// Register the question type
Serializer.addClass(
  QuestionBodyPainDiagramModel.typeName,
  [],
  function() {
    return new QuestionBodyPainDiagramModel('');
  },
  'question'
);

// Add to toolbox
if (typeof window !== 'undefined' && (window as any).SurveyCreator) {
  const componentInfo = {
    name: QuestionBodyPainDiagramModel.typeName,
    title: 'Body Pain Diagram',
    category: 'Healthcare',
    iconName: 'icon-panel',
    json: {
      type: QuestionBodyPainDiagramModel.typeName,
      title: 'Please mark areas where you experience pain',
      description: 'Click on the body diagram to indicate pain locations and intensity'
    }
  };

  (window as any).SurveyCreator.defaultToolbox.addItem(componentInfo);
}

// Create the React component
export class SurveyQuestionBodyPainDiagram extends SurveyQuestionElementBase {

  get question(): QuestionBodyPainDiagramModel {
    return this.questionBase as QuestionBodyPainDiagramModel;
  }

  protected renderElement(): JSX.Element {
    return (
      <BodyPainDiagram
        value={this.question.value}
        onChange={(marks) => {
          this.question.value = marks;
        }}
        readOnly={this.question.isReadOnly}
      />
    );
  }
}

// Register the React component
ReactQuestionFactory.Instance.registerQuestion(
  QuestionBodyPainDiagramModel.typeName,
  (props: any) => {
    return React.createElement(SurveyQuestionBodyPainDiagram, props);
  }
);

// Export for use in other components
export default QuestionBodyPainDiagramModel;