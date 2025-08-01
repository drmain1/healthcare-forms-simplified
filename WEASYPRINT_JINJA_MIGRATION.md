# WeasyPrint + Jinja2 PDF Generation Migration Guide

## Overview
This document provides a complete implementation guide for migrating from SurveyJS PDF generation to a WeasyPrint + Jinja2 based solution for creating beautiful, flexible PDF forms.

## Current State Analysis

### Existing Implementation
- **Frontend PDF Generation**: Using `survey-pdf` npm package (v2.1.1)
- **Client-side rendering**: PDFs generated in browser
- **Files involved**:
  - `/frontend/src/utils/pdfExport.ts`
  - `/frontend/src/utils/pdfExportFlattened.ts`
  - `/frontend/src/components/Responses/ResponseDetail.tsx`
  - `/frontend/src/components/Responses/ResponsesList.tsx`
  - `/frontend/src/components/Dashboard/FormsList.tsx`

### Current Usage Points
1. **ResponseDetail.tsx**: Line 131 - Single response PDF export
2. **ResponsesList.tsx**: Lines 97, 188 - Response PDF and blank form PDF
3. **FormsList.tsx**: Line 514 - Blank form PDF generation

## Implementation Plan

### Phase 1: Backend Infrastructure Setup

#### 1.1 System Dependencies
```bash
# Ubuntu/Debian
sudo apt-get install python3-pip python3-cffi python3-brotli libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz0b libpangocairo-1.0-0

# macOS
brew install cairo pango gdk-pixbuf libffi

# For production Docker container, add to Dockerfile:
RUN apt-get update && apt-get install -y \
    python3-pip python3-cffi python3-brotli \
    libpango-1.0-0 libpangoft2-1.0-0 \
    libharfbuzz0b libpangocairo-1.0-0 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
```

#### 1.2 Python Dependencies
Add to `backend-fastapi/requirements.txt`:
```
weasyprint==62.3
Jinja2==3.1.4
```

#### 1.3 Create PDF Service
Create `backend-fastapi/services/pdf_generator.py`:
```python
import os
from typing import Dict, Any, Optional, List
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
import logging

logger = logging.getLogger(__name__)

class PDFGenerator:
    def __init__(self):
        template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates', 'pdf')
        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
        self.font_config = FontConfiguration()
        
    def transform_surveyjs_data(self, form_schema: Dict[str, Any], response_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Transform SurveyJS schema and response data for template rendering"""
        # Implementation details in actual file
        pass
        
    def generate_response_pdf(self, form_schema: Dict[str, Any], response_data: Dict[str, Any], 
                            form_title: str, patient_name: Optional[str] = None) -> bytes:
        """Generate PDF for a filled form response"""
        template = self.env.get_template('forms/response_form.html')
        
        context = {
            'form_title': form_title,
            'patient_name': patient_name or 'Anonymous',
            'submission_date': datetime.now().strftime('%B %d, %Y'),
            'form_data': self.transform_surveyjs_data(form_schema, response_data),
            'response_data': response_data
        }
        
        html_string = template.render(context)
        
        # Get CSS files
        base_css = CSS(filename=os.path.join(self.env.loader.searchpath[0], 'styles', 'base.css'))
        healthcare_css = CSS(filename=os.path.join(self.env.loader.searchpath[0], 'styles', 'healthcare.css'))
        
        # Generate PDF
        html = HTML(string=html_string, base_url=self.env.loader.searchpath[0])
        pdf_bytes = html.write_pdf(
            stylesheets=[base_css, healthcare_css],
            font_config=self.font_config
        )
        
        return pdf_bytes
        
    def generate_blank_pdf(self, form_schema: Dict[str, Any], form_title: str) -> bytes:
        """Generate blank form PDF"""
        template = self.env.get_template('forms/blank_form.html')
        
        context = {
            'form_title': form_title,
            'form_data': self.transform_surveyjs_data(form_schema),
            'generation_date': datetime.now().strftime('%B %d, %Y')
        }
        
        html_string = template.render(context)
        
        base_css = CSS(filename=os.path.join(self.env.loader.searchpath[0], 'styles', 'base.css'))
        healthcare_css = CSS(filename=os.path.join(self.env.loader.searchpath[0], 'styles', 'healthcare.css'))
        
        html = HTML(string=html_string, base_url=self.env.loader.searchpath[0])
        pdf_bytes = html.write_pdf(
            stylesheets=[base_css, healthcare_css],
            font_config=self.font_config
        )
        
        return pdf_bytes
```

#### 1.4 Template Directory Structure
Create the following structure:
```
backend-fastapi/templates/pdf/
├── base.html
├── components/
│   ├── text_field.html
│   ├── radiogroup.html
│   ├── checkbox.html
│   ├── dropdown.html
│   ├── comment.html
│   ├── boolean.html
│   ├── rating.html
│   ├── matrix.html
│   ├── file.html
│   ├── signaturepad.html
│   ├── dateofbirth.html
│   ├── heightslider.html
│   ├── weightslider.html
│   └── bodypaindiagram.html
├── styles/
│   ├── base.css
│   ├── healthcare.css
│   └── print.css
└── forms/
    ├── response_form.html
    └── blank_form.html
```

### Phase 2: API Endpoints

#### 2.1 Update Forms Router
Add to `backend-fastapi/routers/forms.py`:
```python
from fastapi import HTTPException, Depends, Response
from services.pdf_generator import PDFGenerator

pdf_generator = PDFGenerator()

@router.post("/forms/{form_id}/pdf/response/{response_id}")
async def generate_response_pdf(
    form_id: str,
    response_id: str,
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client)
):
    """Generate PDF for a form response"""
    try:
        # Get form and response from Firestore
        form_doc = db.collection("forms").document(form_id).get()
        if not form_doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
            
        response_doc = db.collection("form_responses").document(response_id).get()
        if not response_doc.exists:
            raise HTTPException(status_code=404, detail="Response not found")
            
        form_data = form_doc.to_dict()
        response_data = response_doc.to_dict()
        
        # Verify permissions
        if form_data.get("organization_id") != current_user.get("organization_id"):
            raise HTTPException(status_code=403, detail="Access denied")
            
        # Generate PDF
        pdf_bytes = pdf_generator.generate_response_pdf(
            form_schema=form_data.get("surveyJson", {}),
            response_data=response_data.get("response_data", {}),
            form_title=form_data.get("title", "Untitled Form"),
            patient_name=response_data.get("patient_name")
        )
        
        # Generate filename
        patient = response_data.get("patient_name", "Anonymous")
        date = datetime.now().strftime("%Y-%m-%d")
        filename = f"{patient}_{form_data.get('title', 'Form')}_{date}.pdf"
        filename = "".join(c for c in filename if c.isalnum() or c in (' ', '-', '_')).rstrip()
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}.pdf"'
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF")

@router.post("/forms/{form_id}/pdf/blank")
async def generate_blank_form_pdf(
    form_id: str,
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client)
):
    """Generate blank form PDF"""
    try:
        # Get form from Firestore
        form_doc = db.collection("forms").document(form_id).get()
        if not form_doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
            
        form_data = form_doc.to_dict()
        
        # Verify permissions
        if form_data.get("organization_id") != current_user.get("organization_id"):
            raise HTTPException(status_code=403, detail="Access denied")
            
        # Generate PDF
        pdf_bytes = pdf_generator.generate_blank_pdf(
            form_schema=form_data.get("surveyJson", {}),
            form_title=form_data.get("title", "Untitled Form")
        )
        
        filename = f"{form_data.get('title', 'Form')}_Blank_Template"
        filename = "".join(c for c in filename if c.isalnum() or c in (' ', '-', '_')).rstrip()
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}.pdf"'
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating blank PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF")
```

### Phase 3: Frontend Updates

#### 3.1 Add API Methods
Update `frontend/src/store/api/formsApi.ts`:
```typescript
export const formsApi = createApi({
  // ... existing code ...
  endpoints: (builder) => ({
    // ... existing endpoints ...
    
    generateResponsePdf: builder.mutation<Blob, { formId: string; responseId: string }>({
      query: ({ formId, responseId }) => ({
        url: `/forms/${formId}/pdf/response/${responseId}`,
        method: 'POST',
        responseHandler: async (response) => {
          if (!response.ok) {
            throw new Error('Failed to generate PDF');
          }
          return response.blob();
        },
      }),
    }),
    
    generateBlankFormPdf: builder.mutation<Blob, string>({
      query: (formId) => ({
        url: `/forms/${formId}/pdf/blank`,
        method: 'POST',
        responseHandler: async (response) => {
          if (!response.ok) {
            throw new Error('Failed to generate PDF');
          }
          return response.blob();
        },
      }),
    }),
  }),
});

export const { useGenerateResponsePdfMutation, useGenerateBlankFormPdfMutation } = formsApi;
```

#### 3.2 Update Components

**ResponseDetail.tsx** changes:
```typescript
import { useGenerateResponsePdfMutation } from '../../store/api/formsApi';

// Inside component:
const [generatePdf, { isLoading: isGeneratingPdf }] = useGenerateResponsePdfMutation();

// Replace onClick handler (around line 130):
onClick={async () => {
  try {
    const blob = await generatePdf({ 
      formId: formId!, 
      responseId: responseId! 
    }).unwrap();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${response.patient_name || 'Anonymous'}_${form.title}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    // Show error message to user
  }
}}
```

### Phase 4: Template Examples

#### 4.1 Base Template (`templates/pdf/base.html`):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{% block title %}{{ form_title }}{% endblock %}</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='styles/base.css') }}">
    {% block extra_css %}{% endblock %}
</head>
<body>
    <header>
        <div class="header-content">
            <h1>{{ form_title }}</h1>
            {% block header_info %}{% endblock %}
        </div>
    </header>
    
    <main>
        {% block content %}{% endblock %}
    </main>
    
    <footer>
        <div class="footer-content">
            <span>Page <span class="page-number"></span> of <span class="total-pages"></span></span>
            <span>Generated on {{ generation_date|default(submission_date) }}</span>
        </div>
    </footer>
</body>
</html>
```

#### 4.2 Base CSS (`templates/pdf/styles/base.css`):
```css
@page {
    size: letter;
    margin: 0.75in 0.5in;
    
    @top-center {
        content: element(header);
    }
    
    @bottom-center {
        content: element(footer);
    }
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', 'Helvetica', sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #333;
}

header {
    position: running(header);
    border-bottom: 2px solid #1976d2;
    padding-bottom: 10px;
    margin-bottom: 20px;
}

footer {
    position: running(footer);
    border-top: 1px solid #ccc;
    padding-top: 10px;
    font-size: 9pt;
    color: #666;
    display: flex;
    justify-content: space-between;
}

.page-number::after {
    content: counter(page);
}

.total-pages::after {
    content: counter(pages);
}

/* Form element styles */
.form-section {
    margin-bottom: 20px;
    page-break-inside: avoid;
}

.form-question {
    margin-bottom: 15px;
}

.question-title {
    font-weight: bold;
    margin-bottom: 5px;
}

.question-answer {
    padding-left: 20px;
    color: #555;
}

/* Responsive tables for matrix questions */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
}

th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}

th {
    background-color: #f5f5f5;
    font-weight: bold;
}

/* Signature styling */
.signature-box {
    border: 1px solid #333;
    height: 60px;
    margin: 10px 0;
    position: relative;
}

.signature-label {
    position: absolute;
    bottom: -20px;
    left: 0;
    font-size: 9pt;
    color: #666;
}
```

### Phase 5: Migration Strategy

#### 5.1 Feature Flag Implementation
Add to frontend environment variables:
```typescript
// .env
REACT_APP_USE_SERVER_PDF=false

// In components:
const useServerPdf = process.env.REACT_APP_USE_SERVER_PDF === 'true';
```

#### 5.2 Gradual Rollout
1. Deploy backend changes first
2. Test with internal users using feature flag
3. Monitor performance and quality
4. Gradually increase percentage of users
5. Remove old code after full migration

### Phase 6: Cleanup Tasks

#### 6.1 Remove Dependencies
```bash
# Remove from package.json
npm uninstall survey-pdf

# Delete files:
rm frontend/src/utils/pdfExport.ts
rm frontend/src/utils/pdfExportFlattened.ts
```

#### 6.2 Update Imports
Remove all imports of the old PDF utilities from:
- `ResponseDetail.tsx`
- `ResponsesList.tsx`
- `FormsList.tsx`

## Dependencies and Second-Order Effects Analysis

### System Dependencies
1. **WeasyPrint System Requirements**:
   - Cairo, Pango, and related libraries
   - Impacts: Docker image size will increase (~100MB)
   - Mitigation: Use multi-stage Docker builds

2. **Font Dependencies**:
   - Liberation fonts for consistent rendering
   - Impacts: May need custom fonts for branding
   - Mitigation: Include fonts in Docker image

### Performance Impacts
1. **Server Load**:
   - PDF generation moves from client to server
   - Impacts: Increased CPU/memory usage on backend
   - Mitigation: Implement caching, queue for batch jobs

2. **Response Times**:
   - Network latency for PDF download
   - Impacts: Slower than client-side for small PDFs
   - Mitigation: Show progress indicators, optimize templates

3. **Concurrent Requests**:
   - Multiple users generating PDFs simultaneously
   - Impacts: Potential server overload
   - Mitigation: Rate limiting, background job queue

### Frontend Changes
1. **Loading States**:
   - Need proper UX during generation
   - Impacts: UI components need updates
   - Already addressed in implementation

2. **Error Handling**:
   - Network failures, timeouts
   - Impacts: Need robust error messages
   - Mitigation: Retry logic, user feedback

### Backend Architecture
1. **Memory Usage**:
   - WeasyPrint loads entire PDF in memory
   - Impacts: Large forms may cause issues
   - Mitigation: Streaming responses, memory limits

2. **Template Management**:
   - New template directory structure
   - Impacts: Deployment complexity
   - Mitigation: Include in Docker image

### Security Considerations
1. **Template Injection**:
   - Jinja2 autoescape must be enabled
   - Impacts: XSS vulnerabilities if misconfigured
   - Already addressed with select_autoescape

2. **File Access**:
   - PDF generation has file system access
   - Impacts: Potential security risk
   - Mitigation: Proper file permissions, sandboxing

### Deployment Considerations
1. **Docker Image Size**:
   - Increase of ~150MB for dependencies
   - Impacts: Slower deployments
   - Mitigation: Layer caching, multi-stage builds

2. **Cloud Run Compatibility**:
   - WeasyPrint works well in Cloud Run
   - Impacts: May need to adjust memory limits
   - Mitigation: Monitor and adjust resources

### Monitoring and Logging
1. **New Metrics Needed**:
   - PDF generation time
   - Memory usage during generation
   - Error rates
   - Queue depth (if implemented)

2. **Logging Updates**:
   - Add PDF-specific logging
   - Track template rendering issues
   - Monitor resource usage

### Rollback Plan
1. Keep old code in place initially
2. Use feature flags for gradual rollout
3. Maintain both endpoints temporarily
4. Have quick rollback procedure ready

### Testing Requirements
1. **Unit Tests**:
   - Test PDF service methods
   - Test data transformation logic
   - Mock WeasyPrint for faster tests

2. **Integration Tests**:
   - Test full PDF generation flow
   - Verify all question types render
   - Test with large forms

3. **Performance Tests**:
   - Load testing for concurrent requests
   - Memory usage profiling
   - Response time benchmarks

## Success Criteria
1. All question types render correctly
2. PDFs are visually appealing and professional
3. Generation time < 5 seconds for typical forms
4. No memory issues with forms up to 100 questions
5. Zero data loss during migration
6. Positive user feedback on PDF quality

## Timeline
- Week 1: Backend implementation and templates
- Week 2: Frontend migration and testing
- Week 3: Gradual rollout and monitoring
- Week 4: Full deployment and cleanup

## Notes for Implementation
1. Start with a simple form to test the pipeline
2. Implement one question type at a time
3. Test PDF generation locally before deploying
4. Keep the old system running in parallel initially
5. Monitor resource usage closely during rollout