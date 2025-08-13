import React from 'react';
import { Question, Serializer } from 'survey-core';
import { SurveyQuestionElementBase, ReactQuestionFactory } from 'survey-react-ui';
import { BodyDiagram2, renderBodyDiagram2ForPDF } from './BodyDiagram2';

// Define the custom question model
export class QuestionBodyDiagram2Model extends Question {
  static readonly typeName = 'bodydiagram2';

  getType(): string {
    return QuestionBodyDiagram2Model.typeName;
  }

  get value() {
    return this.getPropertyValue('value', []);
  }

  set value(newValue: any) {
    console.log('[BodyDiagram2Model] Setting value to:', newValue);
    this.setPropertyValue('value', newValue);
    console.log('[BodyDiagram2Model] Value after setPropertyValue:', this.getPropertyValue('value'));
  }

  // Override to handle PDF export
  public getDisplayValue(keysAsText: boolean, value?: any): any {
    const marks = value || this.value || [];
    if (marks.length === 0) return 'No sensation areas marked';
    
    // Return a summary for display
    const summary = marks.map((mark: any, index: number) => 
      `Area ${index + 1}: ${mark.sensation}`
    ).join(', ');
    
    return summary;
  }

  // Method to get HTML for PDF rendering
  public getHtmlForPDF(): string {
    return renderBodyDiagram2ForPDF(this.value || []);
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
      sensation: mark.sensation,
      ...(mark.label && { label: mark.label })
    })).filter((mark: any) => 
      mark.id && 
      typeof mark.x === 'number' && 
      typeof mark.y === 'number' &&
      mark.sensation
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
  QuestionBodyDiagram2Model.typeName,
  [
    {
      name: 'value',
      default: [],
      category: 'data',
      visible: false,
      isSerializable: true,
    },
  ],
  function() {
    return new QuestionBodyDiagram2Model('');
  },
  'question'
);

// Add to toolbox
if (typeof window !== 'undefined' && (window as any).SurveyCreator) {
  const componentInfo = {
    name: QuestionBodyDiagram2Model.typeName,
    title: 'Body Diagram 2',
    category: 'Healthcare',
    iconName: 'icon-panel',
    json: {
      type: QuestionBodyDiagram2Model.typeName,
      title: 'Please mark areas where you experience different sensations',
      description: 'Click on the body diagram to indicate sensation locations and types'
    }
  };

  (window as any).SurveyCreator.defaultToolbox.addItem(componentInfo);
}

// Create the React component
export class SurveyQuestionBodyDiagram2 extends SurveyQuestionElementBase {

  get question(): QuestionBodyDiagram2Model {
    return this.questionBase as QuestionBodyDiagram2Model;
  }

  protected renderElement(): JSX.Element {
    console.log('[BodyDiagram2Question] Current value:', this.question.value);
    return (
      <BodyDiagram2
        value={this.question.value}
        onChange={(marks) => {
          console.log('[BodyDiagram2Question] onChange called with:', marks);
          this.question.value = marks;
          console.log('[BodyDiagram2Question] Value after setting:', this.question.value);
        }}
        readOnly={this.question.isReadOnly}
      />
    );
  }
}

// Register the React component
ReactQuestionFactory.Instance.registerQuestion(
  QuestionBodyDiagram2Model.typeName,
  (props: any) => {
    return React.createElement(SurveyQuestionBodyDiagram2, props);
  }
);

// Export for use in other components
export default QuestionBodyDiagram2Model;