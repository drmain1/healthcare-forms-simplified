# WeasyPrint + Jinja2 PDF Generation Implementation Guide

## Overview
This document is the source of truth for our server-side PDF generation system using WeasyPrint + Jinja2, which replaced the client-side SurveyJS PDF generation. The new system provides professional medical PDFs with AI-generated clinical summaries.

## Implementation Status: ✅ COMPLETED

### Migration Decision
We migrated from client-side to server-side PDF generation to provide:
- **Consistent, professional medical PDFs** for all users
- **AI-generated clinical summaries** using Vertex AI/Gemini
- **Better handling of complex forms** and layouts
- **No browser memory limitations**
- **Single PDF format** to avoid user confusion (doctors don't need to choose between PDF types)

### Previous Implementation (Removed)
- **Frontend PDF Generation**: Was using `survey-pdf` npm package
- **Client-side rendering**: PDFs generated in browser
- **Removed files**:
  - `/frontend/src/utils/pdfExport.ts` ❌
  - `/frontend/src/utils/pdfExportFlattened.ts` ❌
  - All client-side PDF generation code ❌

## Current Implementation Architecture

### Backend Infrastructure

#### System Dependencies
```bash
# Ubuntu/Debian (including Google Cloud Run)
apt-get install python3-pip python3-cffi python3-brotli libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz0b libpangocairo-1.0-0

# For production Docker container:
RUN apt-get update && apt-get install -y \
    python3-pip python3-cffi python3-brotli \
    libpango-1.0-0 libpangoft2-1.0-0 \
    libharfbuzz0b libpangocairo-1.0-0 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
```

#### Python Dependencies (✅ Added to requirements.txt)
```
weasyprint==62.3
Jinja2==3.1.4
```

### File Structure

```
backend-fastapi/
├── services/
│   └── pdf_generator.py          # Main PDF generation service with AI
├── templates/pdf/
│   ├── response_form.html        # Template for filled responses
│   ├── blank_form.html           # Template for blank forms
│   └── styles/
│       ├── base.css              # Base PDF styling
│       └── medical.css           # Medical-specific styling
└── routers/
    └── forms.py                  # Added PDF endpoints
```

### Key Implementation Features

#### 1. PDF Generator Service (`services/pdf_generator.py`)
- **AI Clinical Summary Generation**: Uses Vertex AI Gemini model to create professional summaries
- **SurveyJS Data Transformation**: Converts form schema to template-friendly format
- **Two PDF Types**:
  - Response PDFs with patient data and AI summary
  - Blank form PDFs for printing

#### 2. API Endpoints (Added to `routers/forms.py`)
```python
# Generate PDF for a form response
POST /api/v1/forms/{form_id}/pdf/response/{response_id}?include_summary=true

# Generate blank form PDF
POST /api/v1/forms/{form_id}/pdf/blank
```

#### 3. Frontend Integration

**New API Methods** (`store/api/formsApi.ts`):
```typescript
generateResponsePdf: builder.mutation<Blob, { 
  formId: string; 
  responseId: string; 
  includeSummary?: boolean 
}>

generateBlankFormPdf: builder.mutation<Blob, string>
```

**Updated Components**:
- `PdfExportButton.tsx`: Simple button component (no options menu)
- `ResponseDetail.tsx`: Uses PdfExportButton
- `ResponsesList.tsx`: Server-side blank form generation
- `FormsList.tsx`: Server-side PDF for all exports

### AI Clinical Summary Feature

The system automatically generates a clinical summary that includes:
1. **Chief complaint and key symptoms**
2. **Red flags or concerning findings**
3. **Relevant medical history**
4. **Professional medical language** suitable for physician notes

Example prompt structure:
```python
prompt = f"""You are a medical assistant helping doctors quickly understand patient intake forms.

Form: {form_title}
Patient Responses: {questions_answers}

Please provide a concise clinical summary (2-3 paragraphs) that:
1. Highlights the chief complaint and key symptoms
2. Notes any red flags or concerning findings
3. Summarizes relevant medical history
4. Is written in professional medical language suitable for physician notes
"""
```

### PDF Templates

#### Response Form Template (`response_form.html`)
- Patient information header
- Optional AI-generated clinical summary section
- Complete form responses
- Professional medical styling
- Page numbers and generation timestamp

#### Blank Form Template (`blank_form.html`)
- Form title and metadata
- Patient information fields
- All questions with appropriate input areas
- Print-optimized layout

### CSS Styling

#### Base CSS (`base.css`)
- Page setup (letter size, margins)
- Header/footer positioning
- Typography and spacing
- Print-specific rules

#### Medical CSS (`medical.css`)
- Clinical summary styling
- Form question/answer formatting
- Professional medical document appearance
- Responsive tables for matrix questions
- Signature boxes and special fields

## Production Deployment Checklist

### 1. Backend Deployment
- [ ] Install system dependencies in Docker/Cloud Run
- [ ] Update `requirements.txt` with WeasyPrint dependencies
- [ ] Deploy PDF templates and CSS files
- [ ] Ensure Vertex AI credentials are configured
- [ ] Test PDF generation endpoints

### 2. Frontend Deployment
- [ ] Remove all references to old PDF utilities
- [ ] Deploy updated components
- [ ] Test PDF downloads in production

### 3. Monitoring
- [ ] Monitor PDF generation performance
- [ ] Track AI summary generation success/failures
- [ ] Watch for memory usage during PDF generation

## Important Architecture Decisions

### 1. No Fallback to Client-Side
We intentionally removed all client-side PDF generation to ensure consistency. All PDFs go through the server.

### 2. Always Include AI Summary
The AI summary is always generated (no toggle) to provide maximum value to doctors.

### 3. Synchronous Generation
PDFs are generated synchronously on request rather than queued, providing immediate feedback to users.

### 4. Error Handling
If PDF generation fails, users see a clear error message. No silent failures or fallbacks.

## Performance Considerations

### Memory Usage
- WeasyPrint loads entire PDF in memory
- Large forms (100+ questions) may require increased Cloud Run memory
- Current setup handles typical medical forms without issues

### Generation Time
- Typical form: 2-4 seconds (including AI summary)
- Large forms: 5-10 seconds
- Network latency adds 1-2 seconds

### Optimization Tips
1. Cache generated PDFs for unchanged responses
2. Use Cloud CDN for frequently accessed blank forms
3. Consider background generation for very large forms

## Security Considerations

1. **Template Injection**: Jinja2 autoescape is enabled
2. **File Access**: Templates are included in deployment, not user-accessible
3. **AI Prompt Injection**: Medical context limits potential misuse
4. **Authentication**: All PDF endpoints require user authentication

## Future Enhancements

1. **Custom Templates**: Allow organizations to upload branded templates
2. **Batch Generation**: Generate multiple PDFs in one request
3. **Email Integration**: Send PDFs directly to physicians
4. **Digital Signatures**: Add cryptographic signatures for compliance

## Troubleshooting

### Common Issues

1. **"Failed to generate PDF" error**
   - Check WeasyPrint system dependencies
   - Verify Vertex AI credentials
   - Check Cloud Run memory limits

2. **Missing styles in PDF**
   - Ensure CSS files are deployed
   - Check template paths in pdf_generator.py

3. **AI summary not appearing**
   - Verify Vertex AI quota
   - Check prompt formatting
   - Review AI model response

### Debug Commands
```bash
# Test WeasyPrint installation
python -c "import weasyprint; print(weasyprint.__version__)"

# Check system dependencies
apt list --installed | grep -E "pango|cairo"

# Test template rendering
python backend-fastapi/services/pdf_generator.py
```

## References

- [WeasyPrint Documentation](https://weasyprint.org/)
- [Jinja2 Template Documentation](https://jinja.palletsprojects.com/)
- [Vertex AI Gemini API](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)
- [Cloud Run PDF Generation Best Practices](https://cloud.google.com/run/docs/tutorials/gcloud)