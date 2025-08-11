# Guide: Creating Custom Tables in PDFs

This document outlines the convention and process for rendering specific SurveyJS form sections as custom, high-density tables within a PDF document.

## 1. Core Concept

To maintain a clean and scalable PDF generation service, we use a special convention to trigger custom table rendering. Instead of overloading the main generator with logic for every possible table, we designate specific panels in the SurveyJS JSON to be handled by dedicated data transformers and HTML templates.

## 2. The Convention

To mark a panel for custom rendering, you need to make two simple changes to its JSON definition:

1.  **`"type"`**: Change the type from `"panel"` to `"custom_table"`.
2.  **`"name"`**: Assign a unique and descriptive name. This name is crucial as it acts as the key to map the panel to the correct data transformation logic on the backend.

### Example: Pain Assessment Table

Here is how the `pain_assessment_panel` is configured in the form's JSON to trigger the custom table logic.

**Original JSON:**
```json
{
  "type": "panel",
  "name": "panel1",
  "title": "Visual Analog Scale & Pain Assessment",
  "elements": [...]
}
```

**Modified JSON for Custom Rendering:**
```json
{
  "type": "custom_table",
  "name": "pain_assessment_panel", // Unique name to identify the table type
  "title": "Visual Analog Scale & Pain Assessment",
  "elements": [...] // The questions for the table remain here
}
```

## 3. Backend Implementation

The backend process involves three main steps:

1.  **Detection**: The `html_generator.go` service iterates through the form elements. When it encounters an element with `"type": "custom_table"`, it triggers the special handling logic.

2.  **Data Transformation**: The service uses the `name` of the panel (e.g., `"pain_assessment_panel"`) to look up a corresponding "data transformer" function. This function is responsible for:
    *   Extracting the relevant answers from the raw form response data.
    *   Structuring the data into a format that is easy for the HTML template to render (e.g., a slice of structs, where each struct represents a row in the table).

3.  **Template Rendering**: The transformed, structured data is then passed to a dedicated HTML template (e.g., `pain_assessment_table.html`). This template contains the specific HTML and CSS needed to render the table correctly.

## 4. How to Add a New Custom Table

This approach is designed to be easily extended. To add a new type of custom table:

1.  **Modify JSON**: In your SurveyJS form, define the panel for your new table. Set its `type` to `"custom_table"` and give it a unique `name` (e.g., `"medication_log_table"`).

2.  **Create a Data Transformer**: In the Go backend, create a new function that transforms the answers for your new table into a structured slice of data.

3.  **Register the Transformer**: Add your new function to the map of data transformers, using the panel's `name` as the key.

4.  **Create an HTML Template**: Create a new `.html` file in the `templates` directory with the specific layout for your new table.
