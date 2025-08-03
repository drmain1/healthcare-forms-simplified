import os
from typing import Dict, Any, Optional, List
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, select_autoescape
from xhtml2pdf import pisa
from io import BytesIO
import logging
import vertexai
from vertexai.generative_models import GenerativeModel

logger = logging.getLogger(__name__)

class PDFGenerator:
    def __init__(self):
        self.template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates', 'pdf')
        self.static_dir = os.path.join(os.path.dirname(__file__), '..', 'static')
        self.env = Environment(
            loader=FileSystemLoader(self.template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
        
        # Initialize Vertex AI for summary generation
        self.ai_model = GenerativeModel("gemini-1.5-flash")

    def _generate_pdf_from_html(self, html_string: str) -> bytes:
        """Generate PDF from a given HTML string using xhtml2pdf."""
        pdf_buffer = BytesIO()
        
        # Path to the directory containing fonts, relative to the static directory
        fonts_dir = os.path.join(self.static_dir, 'fonts')
        
        # We need to pass the base path for static files to pisa
        # This allows it to find the fonts referenced in the CSS
        pisa_status = pisa.CreatePDF(
            src=html_string,
            dest=pdf_buffer,
            link_callback=lambda uri, rel: os.path.join(self.static_dir, uri.replace('/static/', ''))
        )

        if pisa_status.err:
            logger.error(f"PDF generation error: {pisa_status.err}")
            raise Exception(f"PDF generation failed: {pisa_status.err}")
            
        pdf_bytes = pdf_buffer.getvalue()
        pdf_buffer.close()
        return pdf_bytes

    def generate_clinical_summary(self, form_schema: Dict[str, Any], response_data: Dict[str, Any], form_title: str) -> str:
        """Generate an AI clinical summary of the form responses"""
        try:
            # Create a structured prompt for the AI
            prompt = f"""You are a medical assistant helping doctors quickly understand patient intake forms.
            
Form: {form_title}

Patient Responses:
"""
            # Extract questions and answers
            questions_answers = []
            if 'pages' in form_schema:
                for page in form_schema['pages']:
                    if 'elements' in page:
                        for element in page['elements']:
                            if element.get('name') in response_data:
                                question = element.get('title', element.get('name', 'Unknown'))
                                answer = response_data[element['name']]
                                questions_answers.append(f"Q: {question}\nA: {answer}")
            
            prompt += "\n\n".join(questions_answers)
            
            prompt += """

Please provide a concise clinical summary (2-3 paragraphs) that:
1. Highlights the chief complaint and key symptoms
2. Notes any red flags or concerning findings
3. Summarizes relevant medical history
4. Is written in professional medical language suitable for physician notes

Keep it factual and based only on the provided information."""

            response = self.ai_model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            logger.error(f"Error generating AI summary: {str(e)}")
            return "AI summary generation failed. Please review the full responses below."
        
    def transform_surveyjs_data(self, form_schema: Dict[str, Any], response_data: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Transform SurveyJS schema and response data for template rendering"""
        transformed_data = []
        
        if 'pages' in form_schema:
            for page in form_schema['pages']:
                if 'elements' in page:
                    for element in page['elements']:
                        if response_data and element.get('name') in response_data:
                            question_data = {
                                'type': element.get('type', 'text'),
                                'name': element.get('name'),
                                'title': element.get('title', element.get('name', 'Untitled')),
                                'value': response_data[element['name']],
                                'required': element.get('isRequired', False)
                            }
                            
                            # Format value based on type
                            if element['type'] == 'checkbox' and isinstance(question_data['value'], list):
                                question_data['formatted_value'] = ', '.join(str(v) for v in question_data['value'])
                            elif element['type'] == 'boolean':
                                question_data['formatted_value'] = 'Yes' if question_data['value'] else 'No'
                            elif element['type'] == 'rating':
                                max_rating = element.get('rateMax', 5)
                                question_data['formatted_value'] = f"{question_data['value']} out of {max_rating}"
                            else:
                                question_data['formatted_value'] = str(question_data['value'])
                            
                            transformed_data.append(question_data)
                        elif not response_data:
                            # For blank forms
                            transformed_data.append({
                                'type': element.get('type', 'text'),
                                'name': element.get('name'),
                                'title': element.get('title', element.get('name', 'Untitled')),
                                'value': None,
                                'required': element.get('isRequired', False),
                                'choices': element.get('choices', [])
                            })
        
        return transformed_data
        
    def generate_response_pdf(self, form_schema: Dict[str, Any], response_data: Dict[str, Any],
                            form_title: str, patient_name: Optional[str] = None,
                            include_summary: bool = True) -> bytes:
        """Generate PDF for a filled form response with optional AI summary"""
        template = self.env.get_template('response_form.html')
        
        # Generate AI summary if requested
        clinical_summary = None
        if include_summary:
            clinical_summary = self.generate_clinical_summary(form_schema, response_data, form_title)
        
        context = {
            'form_title': form_title,
            'patient_name': patient_name or 'Anonymous',
            'submission_date': datetime.now().strftime('%B %d, %Y'),
            'submission_time': datetime.now().strftime('%I:%M %p'),
            'clinical_summary': clinical_summary,
            'form_data': self.transform_surveyjs_data(form_schema, response_data),
            'include_summary': include_summary,
            'static_path': f'file://{self.static_dir}'
        }
        
        html_string = template.render(context)
        return self._generate_pdf_from_html(html_string)
        
    def generate_blank_pdf(self, form_schema: Dict[str, Any], form_title: str) -> bytes:
        """Generate blank form PDF"""
        template = self.env.get_template('blank_form.html')
        
        context = {
            'form_title': form_title,
            'form_data': self.transform_surveyjs_data(form_schema),
            'generation_date': datetime.now().strftime('%B %d, %Y'),
            'static_path': f'file://{self.static_dir}'
        }
        
        html_string = template.render(context)
        return self._generate_pdf_from_html(html_string)
