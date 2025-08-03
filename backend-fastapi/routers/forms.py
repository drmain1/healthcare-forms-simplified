from fastapi import APIRouter, HTTPException, Depends, Response, Query
import os
import json
import base64
import re
from typing import List, Optional
import logging
try:
    import json5  # More forgiving JSON parser
    HAS_JSON5 = True
except ImportError:
    HAS_JSON5 = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from models.form import Form, FormCreate, FormUpdate, FormListResponse, PdfProcessRequest, SurveyJSModel
from models.share_link import ShareLink, ShareLinkCreate
from services.firebase_admin import db  # Use the unified Firestore client
import vertexai
from vertexai.generative_models import GenerativeModel, Part, HarmCategory, HarmBlockThreshold
from services.auth import get_current_user
from services.form_mobile_optimizer import form_mobile_optimizer
from services.pdf_generator import PDFGenerator
from datetime import datetime, timezone, timedelta
import secrets
import hashlib

router = APIRouter()

# Initialize PDF generator
pdf_generator = PDFGenerator()

# Initialize Vertex AI
PROJECT_ID = os.environ.get("GCP_PROJECT_ID")
LOCATION = os.environ.get("GCP_LOCATION", "us-central1")

vertexai.init(project=PROJECT_ID, location=LOCATION)

model = GenerativeModel("publishers/google/models/gemini-2.5-pro")

@router.post("/forms/process-pdf-with-vertex", response_model=SurveyJSModel, response_model_by_alias=False, include_in_schema=False)
@router.post("/forms/process-pdf-with-vertex/", response_model=SurveyJSModel, response_model_by_alias=False)
def process_pdf_with_vertex(request: PdfProcessRequest, user: dict = Depends(get_current_user)):
    logger.info(f"Processing PDF for user: {user.get('uid')}")
    try:
        # Decode the base64 PDF data
        pdf_content = base64.b64decode(request.pdf_data)

        # Create the prompt for Vertex AI
        prompt = """You are a hyper-specialized AI system, an expert architect of digital medical forms. Your sole purpose is to meticulously analyze unstructured source material (text, PDF content) and transform it into a single, complete, and perfectly valid SurveyJS JSON object.

## CRITICAL: Your response must be ONLY valid JSON

1. Start your response with { and end with }
2. DO NOT wrap the JSON in markdown code blocks (no ``` or ```json)
3. DO NOT include any text before or after the JSON
4. EVERY property must end with a comma except the last one
5. VERIFY the JSON is valid before responding

## Golden Rule: The Output is ALWAYS a Single JSON Object

Your entire response must be a single, valid JSON object. Do not output any commentary, explanations, apologies, or any text whatsoever outside of the final JSON structure.

---

## I. The Root JSON Schema (Non-Negotiable)

Every JSON object you generate must start with this exact root structure and properties. This is a mandatory requirement.

{
  "title": "Form Title From Source",
  "description": "Optional: A brief description of the form's purpose.",
  "widthMode": "responsive",
  "progressBarLocation": "bottom",
  "showQuestionNumbers": "off",
  "showProgressBar": "bottom",
  "questionsOrder": "initial",
  "pages": [
    // All form content goes here, organized into pages and panels.
  ]
}

---

## II. Core Architectural Principles

1.  **Absolute Completeness:** You must capture every single question, label, checkbox, input field, and choice option from the source. Nothing may be omitted.
2.  **Logical Structure:** Use `panel` elements to group related fields into the visual sections seen in the original form (e.g., "Patient Information," "Medical History"). For long forms, distribute these panels across multiple `pages`.
3.  **Conditional Logic is Paramount (`visibleIf`):** This is your most critical function. You must actively scan the text for relationships between questions to implement `visibleIf` expressions.
    *   **Keywords:** Hunt for phrases like "If yes, please explain...", "If checked, provide details...", "If other, specify...".
    *   **Gating Questions:** A "Yes/No" `radiogroup` is a primary trigger. The question that follows it should be made visible based on its answer.
    *   **Example:**
        *   Source Text: `Do you have any known allergies? [ ] Yes [ ] No. If yes, please list them: __________`
        *   Correct JSON:
            ```json
            {
              "type": "radiogroup",
              "name": "has_allergies",
              "title": "Do you have any known allergies?",
              "choices": ["Yes", "No"],
              "isRequired": true
            },
            {
              "type": "comment",
              "name": "allergy_details",
              "title": "Please list your allergies",
              "visibleIf": "{has_allergies} = 'Yes'",
              "isRequired": true
            }
            ```

---

## III. Master Component Blueprint (Exact JSON Structures)

You must use the following precise JSON structures when you identify these field types. Do not improvise.

| If the form mentions... | Use this SurveyJS type... | **Exact JSON Snippet to Use** |
| :--- | :--- | :--- |
| **Date of Birth, DOB, Birth Date** | `dateofbirth` | `{"type": "dateofbirth", "name": "patient_dob", "title": "Date of Birth", "isRequired": true, "ageFieldName": "patient_age"}` |
| **Patient Height** | `heightslider` | `{"type": "heightslider", "name": "patient_height", "title": "Height", "defaultValue": 66}` |
| **Patient Weight** | `weightslider` | `{"type": "weightslider", "name": "patient_weight", "title": "Weight", "defaultValue": 150}` |
| **Body Pain Diagram/Marking**| `bodypaindiagram` | `{"type": "bodypaindiagram", "name": "pain_location_diagram", "title": "Please mark the areas where you experience pain"}` |
| **Upload Photo ID** | `file` | `{"type": "file", "name": "photo_id", "title": "Upload Photo ID", "acceptedTypes": "image/*", "storeDataAsText": false, "allowMultiple": false, "maxSize": 10485760, "sourceType": "camera,file-picker"}` |
| **Signature Line** | `signaturepad` | `{"type": "signaturepad", "name": "terms_signature", "title": "Electronic Signature", "isRequired": true}` |
| **Simple Text Entry** | `text` | `{"type": "text", "name": "field_name", "title": "Field Title"}` (Add `inputType` for "email", "tel") |
| **Large Text Area** | `comment` | `{"type": "comment", "name": "explanation_field", "title": "Please explain"}` |
| **Single Choice (Yes/No)** | `radiogroup` | `{"type": "radiogroup", "name": "question_name", "title": "Question Title?", "choices": ["Yes", "No"], "colCount": 0}` |
| **Multiple Choices** | `checkbox` | `{"type": "checkbox", "name": "symptoms", "title": "Check all that apply", "choices": ["Option 1", "Option 2"], "colCount": 0}` |

---

## IV. Advanced Workflow Directives

These multi-step workflows require precise execution.

### A. The Patient Demographics Workflow (Highest Priority)

**Trigger:** You MUST activate this workflow if you detect **ANY** of the following common patient information fields. This rule supersedes all other rules for these specific fields.
*   **Keywords:** "First Name", "Last Name", "Preferred Name", "Full Name", "DOB", "Date of Birth", "Age", "Email Address", "Phone Number", "Cell Phone", "Home Phone", "Address", "Street", "City", "State", "Zip Code", "Postal Code", "Today's Date".

**Execution:**
1.  **STOP** creating individual fields for the keywords above.
2.  **GENERATE** this single, unified JSON object instead. This object represents the entire patient information section.
3.  **DO NOT** add any other fields like `title` or `description` to it. Use this exact snippet.

    ```json
    {
      "type": "patient_demographics",
      "name": "patient_demographics_data",
      "title": "Patient Information"
    }
    ```

### B. The Unfailing Insurance Information Workflow

This is a non-negotiable, two-step process that you must follow.

**Trigger:** You MUST activate this workflow if you detect **ANY** mention of health insurance. This includes, but is not limited to:
*   Keywords: "Insurance", "Member ID", "Group Number", "Policy Holder", "Payer", "Carrier".
*   Actions: Any request to "Upload Insurance Card", "Provide Insurance Photo", etc.

**Execution:**

1.  **Step A: The Gating Question.** ALWAYS start with this exact "Yes/No" question. Do not proceed to Step B without it.
    ```json
    {
      "type": "radiogroup",
      "name": "has_insurance",
      "title": "Do you have insurance?",
      "choices": ["Yes", "No"],
      "colCount": 0,
      "isRequired": true
    }
    ```
2.  **Step B: The Conditional Panel.** Immediately following the gating question, place **ALL** insurance-related questions (including file uploads and text fields) inside this panel. This panel **MUST** be conditionally visible based on the answer to the gating question.
    ```json
    {
      "type": "panel",
      "name": "insurance_info_panel",
      "title": "Insurance Information",
      "visibleIf": "{has_insurance} = 'Yes'",
      "elements": [
        {
          "type": "html",
          "name": "insurance_instructions",
          "html": "<p style='color: #1976d2;'>Please use the camera button below to take photos of your insurance card. The information will be automatically extracted.</p>"
        },
        {
          "type": "file",
          "name": "insurance_card_front",
          "title": "Front of Insurance Card",
          "acceptedTypes": "image/*",
          "storeDataAsText": false,
          "allowMultiple": false,
          "maxSize": 10485760,
          "sourceType": "camera,file-picker"
        },
        {
          "type": "file",
          "name": "insurance_card_back",
          "title": "Back of Insurance Card",
          "acceptedTypes": "image/*",
          "storeDataAsText": false,
          "allowMultiple": false,
          "maxSize": 10485760,
          "sourceType": "camera,file-picker"
        },
        // Now, add all the original text fields for insurance info below.
        // Example:
        {
          "type": "text",
          "name": "member_id",
          "title": "Member ID",
          "description": "Will be auto-filled from insurance card"
        }
      ]
    }
    ```

### B. The Terms & Conditions / Consent Workflow

When you encounter legal text, privacy policies, or consent agreements, choose one of these two patterns:

1.  **Pattern 1: Simple Acceptance (Checkbox Only)**
    *   Use this for simple "I agree" statements.
    ```json
    {
      "type": "checkbox",
      "name": "terms_acceptance",
      "title": "Terms and Conditions",
      "isRequired": true,
      "choices": [
        {
          "value": "accepted",
          "text": "I have read and accept the terms and conditions, privacy policy, and consent to treatment."
        }
      ],
      "validators": [{
        "type": "answercount",
        "minCount": 1,
        "text": "You must accept the terms to continue."
      }]
    }
    ```

2.  **Pattern 2: Full Agreement (Panel with Scrollable Text and Signature)**
    *   Use this when there is a block of legal text and a signature is required.
    ```json
    {
      "type": "panel",
      "name": "terms_and_conditions_panel",
      "title": "Terms and Conditions",
      "elements": [
        {
          "type": "html",
          "name": "terms_content",
          "html": "<div style='max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;'>[PASTE FULL TERMS CONTENT HERE]</div>"
        },
        {
          "type": "checkbox",
          "name": "accept_terms_box",
          "title": "Agreement",
          "isRequired": true,
          "choices": [{"value": "accepted", "text": "I have read and accept the terms and conditions."}]
        },
        {
          "type": "signaturepad",
          "name": "terms_signature",
          "title": "Electronic Signature",
          "isRequired": true,
          "visibleIf": "{accept_terms_box} = ['accepted']"
        }
      ]
    }
    ```

---

## V. Mobile-First Design Principles

Every form you generate must be optimized for mobile devices. Apply these rules to ALL form elements:

### A. Radio Button and Checkbox Groups
ALWAYS include these properties for consistent mobile display:
```json
{
  "type": "radiogroup",
  "name": "field_name",
  "title": "Question Title",
  "choices": ["Option 1", "Option 2"],
  "colCount": 0,  // REQUIRED: Forces single column layout, prevents misalignment
  "isRequired": true
}
```

### B. Root Survey Configuration
Your root JSON must include these mobile optimization properties:
```json
{
  "title": "Form Title",
  "description": "Form description",
  "widthMode": "responsive",  // REQUIRED: Enables mobile responsiveness
  "showQuestionNumbers": "off",  // Cleaner mobile UI
  "showProgressBar": "bottom",
  "questionsOrder": "initial",
  "pages": [...]
}
```

### C. Text Input Fields
Include width constraints for better mobile display:
```json
{
  "type": "text",
  "name": "field_name",
  "title": "Field Title",
  "maxWidth": "100%",  // Prevents overflow on mobile
  "inputType": "text"  // or "email", "tel", "number"
}
```

### D. File Upload Fields (Insurance Cards, etc.)
Optimize for mobile camera usage:
```json
{
  "type": "file",
  "name": "insurance_card_front",
  "title": "Front of Insurance Card",
  "acceptedTypes": "image/*",
  "sourceType": "camera,file-picker",  // REQUIRED: Enables camera on mobile
  "storeDataAsText": false,
  "allowMultiple": false,
  "maxSize": 10485760
}
```

### E. CRITICAL Mobile Rules
1. **NEVER use** `"renderAs": "table"` - it breaks mobile layouts
2. **ALWAYS set** `"colCount": 0` for radio/checkbox groups
3. **AVOID** multi-column layouts (colCount > 1) unless absolutely necessary
4. **USE** `"startWithNewLine": false` for inline elements on mobile
5. **INCLUDE** `"maxWidth"` for text inputs to prevent overflow

---

## VI. Modes of Operation

Your final task depends on the user's request. You will be in one of three modes:

*   **Mode 1: GENERATE NEW FORM**
    *   **Input:** Unstructured text or PDF content.
    *   **Action:** Build the entire SurveyJS JSON from scratch, strictly following all principles and blueprints above.

*   **Mode 2: MODIFY EXISTING FORM**
    *   **Input:** An existing SurveyJS JSON and a user prompt describing a change.
    *   **Action:**
        1.  Analyze the provided JSON carefully.
        2.  Apply **only** the requested changes.
        3.  **Crucially, preserve all existing fields, panels, pages, names, and logic that were not part of the user's request.**
        4.  If the modification introduces an opportunity for conditional logic (e.g., adding a follow-up question), **you are authorized to proactively add the `visibleIf` expression** to improve the form's usability.
        5.  Ensure all new fields still conform to the Master Component Blueprint (e.g., a new DOB field must be `dateofbirth`).
        6.  Return the complete, updated JSON object.

*   **Mode 3: TRANSLATE FORM**
    *   **Input:** A SurveyJS JSON and a target language.
    *   **Action:**
        1.  Translate **only** the user-facing text strings: `title`, `description`, `text` (within choices), `html`, and `validators.text`.
        2.  **DO NOT** change any technical keys like `name`, `type`, `visibleIf`, `inputType`, etc.
        3.  Return the complete, translated JSON object.

## Final Command

Your instructions are complete. Now, analyze the user's request and provided content. Execute your operational mode. Generate **only** the single, valid JSON object as your final answer.
        """
        
        # Prepare the request for Vertex AI
        vertex_request = [
            Part.from_data(
                mime_type="application/pdf",
                data=pdf_content
            ),
            Part.from_text(prompt)
        ]

        # Call Vertex AI
        response = model.generate_content(
            vertex_request,
            generation_config={
                "max_output_tokens": 40000,
                "temperature": 0.1,
            },
            safety_settings={
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            }
        )
        
        # Extract and parse the JSON response
        raw_text = response.text.strip()
        logger.info(f"Raw response from Gemini (first 500 chars): {raw_text[:500]}")
        
        # First check if Gemini wrapped the JSON in markdown code blocks
        if '```' in raw_text:
            # Extract content between code blocks
            code_block_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw_text)
            if code_block_match:
                json_string = code_block_match.group(1).strip()
            else:
                # Fallback to finding JSON boundaries
                json_start = raw_text.find('{')
                json_end = raw_text.rfind('}') + 1
                json_string = raw_text[json_start:json_end] if json_start != -1 else ""
        elif raw_text.startswith('{'):
            # Raw JSON response
            json_string = raw_text
        else:
            # Find JSON boundaries
            json_start = raw_text.find('{')
            json_end = raw_text.rfind('}') + 1
            if json_start == -1 or json_end == 0:
                logger.error(f"No JSON found in response. First 200 chars: {raw_text[:200]}")
                raise HTTPException(status_code=500, detail="No valid JSON found in AI response")
            json_string = raw_text[json_start:json_end]

        logger.info(f"Extracted JSON string length: {len(json_string)}")
        logger.info(f"JSON string (first 200 chars): {json_string[:200]}")
        
        try:
            # Try standard JSON first
            form_json = json.loads(json_string)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            logger.error(f"Error at position {e.pos}")
            # Show context around the error position
            start = max(0, e.pos - 100)
            end = min(len(json_string), e.pos + 100)
            logger.error(f"JSON context around position {e.pos}:")
            logger.error(f"...{json_string[start:end]}...")
            
            # Try to fix common JSON errors
            try:
                # Log the problematic section
                problem_start = max(0, e.pos - 200)
                problem_end = min(len(json_string), e.pos + 200)
                logger.info(f"Problematic JSON section: {json_string[problem_start:problem_end]}")
                
                # More comprehensive JSON fixes
                fixed_json = json_string
                
                # Remove any JavaScript-style comments
                fixed_json = re.sub(r'//.*$', '', fixed_json, flags=re.MULTILINE)
                fixed_json = re.sub(r'/\*[\s\S]*?\*/', '', fixed_json)
                
                # Remove trailing commas before closing brackets/braces
                fixed_json = re.sub(r',\s*([}\]])', r'\1', fixed_json)
                
                # Fix malformed arrays (closing bracket followed by values)
                # This handles cases like: ],\n"value1"\n"value2"
                fixed_json = re.sub(r'\],\s*\n\s*("[^"]+"\s*\n\s*(?:"[^"]+"\s*\n\s*)*)', r'],\n[\1', fixed_json)
                
                # Fix missing commas between properties
                # After closing quotes, before opening quotes
                fixed_json = re.sub(r'"\s*\n\s*"', '",\n"', fixed_json)
                # After closing brace/bracket, before opening quote
                fixed_json = re.sub(r'([}\]])\s*\n\s*"', r'\1,\n"', fixed_json)
                # After closing quote, before opening brace/bracket
                fixed_json = re.sub(r'"\s*\n\s*([{\[])', r'",\n\1', fixed_json)
                # Between array items
                fixed_json = re.sub(r'(})\s*\n\s*({)', r'\1,\n\2', fixed_json)
                fixed_json = re.sub(r'(\])\s*\n\s*(\[)', r'\1,\n\2', fixed_json)
                # After boolean/null/number values
                fixed_json = re.sub(r'(true|false|null|\d+)\s*\n\s*(")', r'\1,\n\2', fixed_json)
                
                # Fix double commas
                fixed_json = re.sub(r',\s*,', ',', fixed_json)
                
                # Remove any trailing whitespace
                fixed_json = fixed_json.strip()
                
                form_json = json.loads(fixed_json)
                logger.info("Successfully parsed JSON after applying fixes")
            except Exception as fix_error:
                logger.error(f"Failed to fix JSON: {str(fix_error)}")
                # Last resort: try to use ast.literal_eval
                try:
                    import ast
                    # Convert to Python dict syntax and eval
                    python_dict = json_string.replace('true', 'True').replace('false', 'False').replace('null', 'None')
                    form_json = ast.literal_eval(python_dict)
                    logger.info("Successfully parsed using ast.literal_eval")
                except:
                    raise HTTPException(status_code=500, detail=f"Failed to parse JSON: {str(e)}")
        
        # Optimize form for mobile before validation
        logger.info("Optimizing form for mobile display...")
        form_json = form_mobile_optimizer.optimize_form(form_json)
        
        # Validate mobile properties
        warnings = form_mobile_optimizer.validate_mobile_properties(form_json)
        if warnings:
            logger.warning(f"Mobile optimization warnings: {warnings}")
        
        # Validate the structure with Pydantic before returning
        return SurveyJSModel(**form_json)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF with Vertex AI: {str(e)}")


@router.post("/forms/", response_model=Form, response_model_by_alias=False)
def create_form(form_data: FormCreate, user: dict = Depends(get_current_user)):
    try:
        # In single-user model, organization_id == user_id
        organization_id = user["uid"]
        
        # Check if organization exists, create if not
        org_doc = db.collection('organizations').document(organization_id).get()
        if not org_doc.exists:
            # Auto-create organization for new user
            org_data = {
                'uid': user["uid"],
                'name': user.get("email", "My Organization"),
                'email': user.get("email", ""),
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc),
                'settings': {
                    'hipaa_compliant': True,
                    'data_retention_days': 2555  # 7 years for HIPAA
                }
            }
            db.collection('organizations').document(organization_id).set(org_data)

        # Create the form with required fields
        form_dict = form_data.dict(exclude_unset=True, exclude={'category'})  # Exclude category for now
        
        # Optimize survey JSON for mobile if provided
        if 'surveyJson' in form_dict and form_dict['surveyJson']:
            logger.info("Optimizing survey JSON for mobile...")
            form_dict['surveyJson'] = form_mobile_optimizer.optimize_form(form_dict['surveyJson'])
            
            # Validate mobile properties
            warnings = form_mobile_optimizer.validate_mobile_properties(form_dict['surveyJson'])
            if warnings:
                logger.warning(f"Mobile optimization warnings: {warnings}")
        
        form_dict['created_by'] = user["uid"]
        form_dict['organization_id'] = organization_id
        form_dict['created_at'] = datetime.now(timezone.utc)
        form_dict['updated_at'] = datetime.now(timezone.utc)
        form_dict['updated_by'] = user["uid"]
        
        # Add to Firestore
        doc_ref = db.collection('forms').add(form_dict)
        
        # Create response with proper ID field
        form_dict['_id'] = doc_ref[1].id  # Use _id as expected by the Form model alias
        
        # Debug logging
        logger.info(f"Created form with ID: {doc_ref[1].id}")
        logger.info(f"Form dict: {form_dict}")
        
        created_form = Form(**form_dict)
        logger.info(f"Form response: {created_form.model_dump()}")
        
        return created_form
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forms/", response_model=FormListResponse, response_model_by_alias=False)
def list_forms(user: dict = Depends(get_current_user)):
    try:
        organization_id = user["uid"]
        
        forms = []
        docs = db.collection('forms').where("organization_id", "==", organization_id).stream()
        
        for doc in docs:
            form_data = doc.to_dict()
            form_data["_id"] = doc.id
            forms.append(Form(**form_data))
        
        return {"count": len(forms), "results": forms}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forms/{form_id}", response_model=Form, response_model_by_alias=False, include_in_schema=False)
@router.get("/forms/{form_id}/", response_model=Form, response_model_by_alias=False)
def get_form(form_id: str, user: dict = Depends(get_current_user)):
    try:
        doc = db.collection('forms').document(form_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
        form_data = doc.to_dict()
        form_data["_id"] = doc.id  # Use _id for the alias
        return Form(**form_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/forms/{form_id}", response_model=Form, response_model_by_alias=False, include_in_schema=False)
@router.put("/forms/{form_id}/", response_model=Form, response_model_by_alias=False, include_in_schema=False)
@router.patch("/forms/{form_id}", response_model=Form, response_model_by_alias=False, include_in_schema=False)
@router.patch("/forms/{form_id}/", response_model=Form, response_model_by_alias=False)
def update_form(form_id: str, form_update: FormUpdate, user: dict = Depends(get_current_user)):
    try:
        doc_ref = db.collection('forms').document(form_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        # Get existing form data
        existing_form = doc.to_dict()
        
        # Update only provided fields
        update_dict = form_update.dict(exclude_unset=True, exclude={'category'})
        
        # If survey_json is being updated, optimize it for mobile
        if 'surveyJson' in update_dict and update_dict['surveyJson']:
            logger.info("Optimizing updated survey JSON for mobile...")
            update_dict['surveyJson'] = form_mobile_optimizer.optimize_form(update_dict['surveyJson'])
            
            # Validate mobile properties
            warnings = form_mobile_optimizer.validate_mobile_properties(update_dict['surveyJson'])
            if warnings:
                logger.warning(f"Mobile optimization warnings: {warnings}")
        
        update_dict['updated_at'] = datetime.now(timezone.utc)
        update_dict['updated_by'] = user["uid"]
        
        doc_ref.update(update_dict)
        
        # Return updated form
        existing_form.update(update_dict)
        existing_form['_id'] = form_id  # Use _id for the alias
        return Form(**existing_form)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/forms/{form_id}", status_code=204, include_in_schema=False)
@router.delete("/forms/{form_id}/", status_code=204)
def delete_form(form_id: str, user: dict = Depends(get_current_user)):
    try:
        doc_ref = db.collection('forms').document(form_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        doc_ref.delete()
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/forms/{form_id}/create_share_link/", response_model=ShareLink, response_model_by_alias=False)
def create_share_link(form_id: str, settings: ShareLinkCreate, user: dict = Depends(get_current_user)):
    try:
        # Verify form exists and user has access
        form_doc = db.collection('forms').document(form_id).get()
        if not form_doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        form_data = form_doc.to_dict()
        if form_data.get('organization_id') != user["uid"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Generate unique share token
        share_token = secrets.token_urlsafe(32)
        
        # Create share link data
        share_link_data = {
            'form_id': form_id,
            'organization_id': user["uid"],
            'created_by': user["uid"],
            'created_at': datetime.now(timezone.utc),
            'is_active': True,
            'response_count': 0,
            'share_token': share_token,
            'require_password': settings.require_password,
            'max_responses': settings.max_responses
        }
        
        # Set expiration if specified
        if settings.expires_in_days:
            share_link_data['expires_at'] = datetime.now(timezone.utc) + timedelta(days=settings.expires_in_days)
        
        # Hash password if provided
        if settings.require_password and settings.password:
            share_link_data['password_hash'] = hashlib.sha256(settings.password.encode()).hexdigest()
        
        # Add to Firestore
        doc_ref = db.collection('share_links').add(share_link_data)
        
        # Create response with ID and relative path
        share_link_data['_id'] = doc_ref[1].id
        share_link_data['share_path'] = f"/forms/{form_id}/fill/{share_token}"
        
        return ShareLink(**share_link_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forms/{form_id}/share_links/", response_model=List[ShareLink], response_model_by_alias=False)
def get_share_links(form_id: str, user: dict = Depends(get_current_user)):
    try:
        # Verify form exists and user has access
        form_doc = db.collection('forms').document(form_id).get()
        if not form_doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        form_data = form_doc.to_dict()
        if form_data.get('organization_id') != user["uid"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get all share links for this form
        share_links = []
        docs = db.collection('share_links').where("form_id", "==", form_id).where("is_active", "==", True).stream()
        
        for doc in docs:
            link_data = doc.to_dict()
            link_data["_id"] = doc.id
            # Return relative path instead of full URL
            share_token = link_data.get('share_token', '')
            link_data['share_path'] = f"/forms/{form_id}/fill/{share_token}"
            share_links.append(ShareLink(**link_data))
        
        return share_links
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/forms/{form_id}/share_links/{share_link_id}/", status_code=204)
def delete_share_link(form_id: str, share_link_id: str, user: dict = Depends(get_current_user)):
    """Delete a specific share link"""
    try:
        # Verify form exists and user has access
        form_doc = db.collection('forms').document(form_id).get()
        if not form_doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        form_data = form_doc.to_dict()
        if form_data.get('organization_id') != user["uid"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get the share link document
        share_link_doc = db.collection('share_links').document(share_link_id).get()
        if not share_link_doc.exists:
            raise HTTPException(status_code=404, detail="Share link not found")
        
        share_link_data = share_link_doc.to_dict()
        if share_link_data.get('form_id') != form_id:
            raise HTTPException(status_code=404, detail="Share link not found for this form")
        
        # Delete the share link
        db.collection('share_links').document(share_link_id).delete()
        
        return
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forms/{form_id}/fill/{share_token}/", response_model=Form, response_model_by_alias=True)
def get_form_by_share_token(form_id: str, share_token: str):
    """Public endpoint to get form by share token - no authentication required"""
    try:
        # Find share link by token
        share_link_docs = db.collection('share_links').where("share_token", "==", share_token).where("form_id", "==", form_id).limit(1).stream()
        
        share_link_doc = None
        for doc in share_link_docs:
            share_link_doc = doc
            break
            
        if not share_link_doc:
            raise HTTPException(status_code=404, detail="Invalid share link")
        
        share_link_data = share_link_doc.to_dict()
        
        # Check if link is active
        if not share_link_data.get('is_active', False):
            raise HTTPException(status_code=403, detail="This link is no longer active")
        
        # Check expiration
        expires_at = share_link_data.get('expires_at')
        if expires_at and expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=403, detail="This link has expired")
        
        # Check response limit
        max_responses = share_link_data.get('max_responses')
        response_count = share_link_data.get('response_count', 0)
        if max_responses and response_count >= max_responses:
            raise HTTPException(status_code=403, detail="Response limit reached for this link")
        
        # Get the form
        form_doc = db.collection('forms').document(form_id).get()
        if not form_doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
        
        form_data = form_doc.to_dict()
        form_data["_id"] = form_doc.id
        
        # Log the form data structure for debugging
        logger.info(f"Form data keys: {list(form_data.keys())}")
        if 'survey_json' in form_data:
            logger.info(f"survey_json type: {type(form_data['survey_json'])}")
        if 'surveyJson' in form_data:
            logger.info(f"surveyJson type: {type(form_data['surveyJson'])}")
        
        return Form(**form_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/forms/{form_id}/pdf/response/{response_id}")
async def generate_response_pdf(
    form_id: str,
    response_id: str,
    include_summary: bool = Query(True, description="Include AI-generated clinical summary"),
    current_user: dict = Depends(get_current_user)
):
    """Generate PDF for a form response with optional AI clinical summary"""
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
        if form_data.get("organization_id") != current_user.get("uid"):
            raise HTTPException(status_code=403, detail="Access denied")
            
        # Generate PDF
        pdf_bytes = pdf_generator.generate_response_pdf(
            form_schema=form_data.get("surveyJson", {}),
            response_data=response_data.get("response_data", {}),
            form_title=form_data.get("title", "Untitled Form"),
            patient_name=response_data.get("patient_name"),
            include_summary=include_summary
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
    current_user: dict = Depends(get_current_user)
):
    """Generate blank form PDF"""
    try:
        # Get form from Firestore
        form_doc = db.collection("forms").document(form_id).get()
        if not form_doc.exists:
            raise HTTPException(status_code=404, detail="Form not found")
            
        form_data = form_doc.to_dict()
        
        # Verify permissions
        if form_data.get("organization_id") != current_user.get("uid"):
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
