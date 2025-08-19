import React from 'react';
import { Question, Serializer } from 'survey-core';
import { SurveyQuestionElementBase, ReactQuestionFactory } from 'survey-react-ui';
import { BodyPainDiagram, renderBodyDiagramForPDF } from './BodyPainDiagram';

// Define the custom question model
export class QuestionBodyPainDiagramModel extends Question {
  static readonly typeName = 'bodypaindiagram';

  constructor(name: string) {
    // Ensure name is always a string
    super(typeof name === 'string' ? name : '');
    // Set default metadata for this question type
    this.metadata = { patternType: 'body_pain_diagram' };
  }

  getType(): string {
    return QuestionBodyPainDiagramModel.typeName;
  }

  get value() {
    return this.getPropertyValue('value', []);
  }

  set value(newValue: any) {
    console.log('[BodyPainDiagramModel] Setting value to:', newValue);
    this.setPropertyValue('value', newValue);
    console.log('[BodyPainDiagramModel] Value after setPropertyValue:', this.getPropertyValue('value'));
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
  
  // Override to ensure value is included in survey data
  protected getValueCore(): any {
    return this.value || [];
  }
  
  // Override to ensure value is properly saved
  protected setValueCore(newValue: any): void {
    this.value = newValue;
  }
  
  // Override isEmpty to properly detect empty state
  public isEmpty(): boolean {
    return !this.value || this.value.length === 0;
  }
  
  // Override to ensure data is collected in survey results
  public getPlainData(options?: any): any {
    const data = super.getPlainData(options);
    if (!this.isEmpty()) {
      // Clean the array data to remove any non-serializable properties
      const cleanValue = this.getCleanValue();
      data[this.name] = cleanValue;
    }
    return data;
  }
  
  // Helper method to get clean array without any non-serializable properties
  private getCleanValue(): any[] {
    const currentValue = this.value || [];
    if (!Array.isArray(currentValue)) return [];
    
    // Create clean objects with only the necessary properties
    return currentValue.map((mark: any) => ({
      id: mark.id,
      x: mark.x,
      y: mark.y,
      intensity: mark.intensity,
      ...(mark.label && { label: mark.label })
    })).filter((mark: any) => 
      mark.id && 
      typeof mark.x === 'number' && 
      typeof mark.y === 'number' &&
      mark.intensity
    );
  }
  
  // Override toJSON to ensure clean serialization
  public toJSON(): any {
    const json = super.toJSON();
    if (this.value && Array.isArray(this.value)) {
      json.value = this.getCleanValue();
    }
    return json;
  }
}

// Register the question type
Serializer.addClass(
  QuestionBodyPainDiagramModel.typeName,
  [
    {
      name: 'value',
      default: [],
      category: 'data',
      visible: false,
      isSerializable: true,
    },
    {
      name: 'metadata',
      default: null,
      category: 'general',
      visible: false,
      isSerializable: true,
    },
  ],
  function(name) {
    // Handle various input types from SurveyJS
    const questionName = typeof name === 'string' ? name : '';
    return new QuestionBodyPainDiagramModel(questionName);
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
      description: 'Click on the body diagram to indicate pain locations and intensity',
      metadata: {
        patternType: 'body_pain_diagram'
      }
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
    console.log('[BodyPainDiagramQuestion] Current value:', this.question.value);
    return (
      <BodyPainDiagram
        value={this.question.value}
        onChange={(marks) => {
          console.log('[BodyPainDiagramQuestion] onChange called with:', marks);
          this.question.value = marks;
          console.log('[BodyPainDiagramQuestion] Value after setting:', this.question.value);
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