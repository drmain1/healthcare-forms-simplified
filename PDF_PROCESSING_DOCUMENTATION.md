# PDF Processing System Documentation

## Overview
This document details the PDF to SurveyJS form conversion system, including the complete LLM instructions and error handling mechanisms.

## Current Issues (as of July 31, 2025)

### Primary Error
- **JSON Parsing Errors**: Gemini is returning malformed JSON with missing commas in arrays
- **Error Example**: `ERROR:routers.forms:JSON parsing error: Expecting ',' delimiter: line 634 column 14 (char 23870)`
- **Specific Issue**: Missing commas in choice arrays:
  ```json
  "choices": [
    "Yes",
    "No"    // <-- Missing comma here
  ],
  ```

### Error Logs Location
- **GCP Project**: `healthcare-forms-v2`
- **Service**: `healthcare-forms-backend`
- **Endpoint**: `/api/v1/forms/process-pdf-with-vertex`
- **Error Rate**: Multiple 500 errors with 70-76 second latencies

## Complete LLM Instructions (Current Prompt)

```
You are a hyper-specialized AI system, an expert architect of digital medical forms. Your sole purpose is to meticulously analyze unstructured source material (text, PDF content) and transform it into a single, complete, and perfectly valid SurveyJS JSON object.

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
  "progressBarLocation": "bottom",
  "showQuestionNumbers": "on",
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
| **Upload Insurance Card, Photo ID** | `file` | `{"type": "file", "name": "insurance_card_front", "title": "Upload front of insurance card", "acceptedTypes": "image/*", "storeDataAsText": false, "allowMultiple": false, "maxSize": 10485760, "sourceType": "camera,file-picker"}` |
| **Signature Line** | `signaturepad` | `{"type": "signaturepad", "name": "terms_signature", "title": "Electronic Signature", "isRequired": true}` |
| **Simple Text Entry** | `text` | `{"type": "text", "name": "field_name", "title": "Field Title"}` (Add `inputType` for "email", "tel") |
| **Large Text Area** | `comment` | `{"type": "comment", "name": "explanation_field", "title": "Please explain"}` |
| **Single Choice (Yes/No)** | `radiogroup` | `{"type": "radiogroup", "name": "question_name", "title": "Question Title?", "choices": ["Yes", "No"]}` |
| **Multiple Choices** | `checkbox` | `{"type": "checkbox", "name": "symptoms", "title": "Check all that apply", "choices": ["Option 1", "Option 2"]}` |

---

## IV. Advanced Workflow Directives

These multi-step workflows require precise execution.

### A. The Insurance Information Workflow

If you detect **any** insurance-related fields (Member ID, Group Number, etc.), you must implement the following sequence:

1.  **First, create a gating question:**
    ```json
    {
      "type": "radiogroup",
      "name": "has_insurance",
      "title": "Do you have insurance?",
      "choices": ["Yes", "No"],
      "isRequired": true
    }
    ```
2.  **Next, create the conditional insurance panel:**
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

## V. Modes of Operation

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
```

## Current Error Handling Implementation

### 1. Initial JSON Parsing (lines 304-336)
```python
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
```

### 2. JSON Error Context Logging (lines 340-345)
```python
# Show context around the error position
start = max(0, e.pos - 100)
end = min(len(json_string), e.pos + 100)
logger.error(f"JSON context around position {e.pos}:")
logger.error(f"...{json_string[start:end]}...")
```

### 3. Automated JSON Fixing Attempts (lines 346-398)
```python
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
    fixed_json = re.sub(r'\],\s*\n\s*(".*?"\\s*\n\s*(?:".*?"\\s*\n\s*)*)', r'],\n[\1', fixed_json)
    
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
```

### 4. Final Validation
```python
# Validate the structure with Pydantic before returning
return SurveyJSModel(**form_json)
```

## Known Issues and Solutions

### Issue 1: Missing Commas in Arrays
**Problem**: Gemini generates arrays without commas between elements
```json
"choices": [
  "Yes",
  "No"    // Missing comma
]
```

**Current Fix**: Regex pattern to add missing commas:
```python
fixed_json = re.sub(r'"\s*\n\s*"', '",\n"', fixed_json)
```

**Limitation**: This doesn't catch all cases, especially when there's no newline between elements.

### Issue 2: Markdown Code Blocks
**Problem**: Despite instructions, Gemini sometimes wraps JSON in markdown code blocks
**Current Fix**: Regex extraction of content between ``` markers

### Issue 3: Large Response Size
**Problem**: Responses are 20,000-26,000 characters, increasing chance of formatting errors
**Potential Solution**: Consider breaking forms into smaller sections or using streaming responses

## Recommendations

1. **Improve Prompt Engineering**:
   - Add more explicit examples of correct JSON formatting
   - Emphasize comma placement in arrays
   - Consider using a JSON schema validator in the prompt

2. **Enhanced Error Recovery**:
   - Implement more sophisticated JSON repair algorithms
   - Consider using a dedicated JSON repair library
   - Add retry logic with modified prompts

3. **Alternative Approaches**:
   - Use Gemini's JSON mode if available
   - Consider using a different model for JSON generation
   - Implement a two-step process: generate structure first, then details

4. **Monitoring**:
   - Add metrics for JSON parsing success rate
   - Track common error patterns
   - Set up alerts for high error rates