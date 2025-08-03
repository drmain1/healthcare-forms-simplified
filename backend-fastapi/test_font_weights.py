#!/usr/bin/env python3
"""
Test script to verify variable font weights in PDF generation
"""
from services.pdf_generator import PDFGenerator
import json

# Sample form schema with different question types
test_schema = {
    "pages": [
        {
            "elements": [
                {
                    "type": "text",
                    "name": "patient_name",
                    "title": "Patient Name",
                    "isRequired": True
                },
                {
                    "type": "text",
                    "name": "chief_complaint",
                    "title": "Chief Complaint",
                    "isRequired": True
                },
                {
                    "type": "rating",
                    "name": "pain_level",
                    "title": "Pain Level",
                    "rateMax": 10,
                    "isRequired": False
                },
                {
                    "type": "boolean",
                    "name": "fever",
                    "title": "Do you have a fever?",
                    "isRequired": False
                },
                {
                    "type": "comment",
                    "name": "symptoms",
                    "title": "Describe your symptoms",
                    "isRequired": False
                }
            ]
        }
    ]
}

# Sample response data
test_response = {
    "patient_name": "John Doe",
    "chief_complaint": "Headache and dizziness",
    "pain_level": 7,
    "fever": True,
    "symptoms": "I've been experiencing severe headaches for the past 3 days, accompanied by dizziness and occasional nausea. The pain is primarily on the right side of my head."
}

def test_pdf_generation():
    """Test PDF generation with variable font weights"""
    
    print("Initializing PDF Generator...")
    pdf_gen = PDFGenerator()
    
    print("\n1. Testing filled form PDF with AI summary...")
    try:
        pdf_bytes = pdf_gen.generate_response_pdf(
            form_schema=test_schema,
            response_data=test_response,
            form_title="Patient Intake Form - Font Weight Test",
            patient_name="John Doe",
            include_summary=True
        )
        
        # Save the PDF
        with open("test_filled_form_with_fonts.pdf", "wb") as f:
            f.write(pdf_bytes)
        print("   ✓ Filled form PDF generated: test_filled_form_with_fonts.pdf")
        print("   - Check font weights: Headers (700), Questions (550), Answers (450)")
        print("   - Check AI summary font weight (425)")
    except Exception as e:
        print(f"   ✗ Error generating filled form: {e}")
    
    print("\n2. Testing blank form PDF...")
    try:
        pdf_bytes = pdf_gen.generate_blank_pdf(
            form_schema=test_schema,
            form_title="Patient Intake Form - Blank Template"
        )
        
        # Save the PDF
        with open("test_blank_form_with_fonts.pdf", "wb") as f:
            f.write(pdf_bytes)
        print("   ✓ Blank form PDF generated: test_blank_form_with_fonts.pdf")
        print("   - Check font weights: Headers (700), Labels (550)")
    except Exception as e:
        print(f"   ✗ Error generating blank form: {e}")
    
    print("\nFont weight reference:")
    print("  - 400: Regular body text")
    print("  - 425: AI summary content")
    print("  - 450: Form answers, metadata")
    print("  - 500: Form type, rating options")
    print("  - 550: Question titles, field labels")
    print("  - 600: Required badges")
    print("  - 650: Section headers, question numbers")
    print("  - 700: Clinic name/main title")
    
    print("\n✅ Test complete! Check the generated PDFs to verify font rendering.")

if __name__ == "__main__":
    test_pdf_generation()