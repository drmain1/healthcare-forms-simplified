
# PDF Rendering Improvements

This document outlines the new, dynamic PDF rendering architecture for the Healthcare Forms Platform. This system is designed to be scalable, maintainable, and capable of producing high-fidelity, professional medical forms from complex JSON structures.

## 1. Architecture Overview

The previous system used a static HTML template that required manual updates for any change to the form. The new system uses a dynamic, layout-aware approach.

The core principle is the **separation of content from presentation**:
- **Content (The Form JSON):** The SurveyJS JSON file defines the questions, pages, and panels of the form. It is now the single source of truth.
- **Layout Hints (Embedded in JSON):** We have introduced custom fields within the JSON to provide layout instructions to the rendering engine.
- **Engine (Go Backend):** The Go backend reads the JSON and the layout hints to dynamically construct a purpose-built HTML document.
- **Presentation (CSS & Gotenberg):** The generated HTML uses CSS Grid and Flexbox for precise layout, and this HTML is then sent to the Gotenberg service for final PDF conversion.

This architecture allows for complex, multi-column layouts and ensures that changes to the form only require editing the JSON, not the Go code.

## 2. Layout Hints in Form JSON

To control the PDF layout, we have added the following custom properties to the SurveyJS JSON structure. These are added to `panel` elements within the form.

- `"layoutColumns": <number>`: When added to a panel, this property instructs the renderer to arrange the panel's child elements into a CSS grid with the specified number of columns.
  - *Example:* `"layoutColumns": 2` will create a two-column grid.

- `"colSpan": <number>`: When added to a question *inside* a grid panel, this property makes the element span a specified number of columns.
  - *Example:* `"colSpan": 2` will make a field take up the full width of a two-column grid.

### Example JSON with Layout Hints:

```json
{
  "type": "panel",
  "name": "patient_demographics",
  "layoutColumns": 2, // This panel will be a 2-column grid
  "elements": [
    {
      "type": "text",
      "name": "first_name",
      "title": "First Name"
    },
    {
      "type": "text",
      "name": "last_name",
      "title": "Last Name"
    },
    {
      "type": "text",
      "name": "street_address",
      "title": "Street Address",
      "colSpan": 2 // This element will span both columns
    }
  ]
}
```

## 3. Key Go Files & Dependencies

The PDF generation logic is primarily handled by two files in the `backend-go` service.

### `internal/services/html_generator.go`
- **Responsibility:** This file contains the core logic for dynamically generating the HTML.
- **`GenerateDynamicHTML` function:** This is the main function. It takes the form JSON string and the patient's answers, parses them into Go structs, and then uses a Go `html/template` to loop through the form structure and build the final HTML string, applying the layout hints as it goes.
- **Dependencies:**
  - `encoding/json`: For parsing the form JSON.
  - `html/template`: For safely executing the Go template that builds the HTML.

### `internal/api/pdf_generator.go`
- **Responsibility:** This file contains the API handler that orchestrates the entire PDF generation process.
- **`GeneratePDFHandler` function:** This function is triggered by the frontend. It fetches the form and response data from Firestore, calls `GenerateDynamicHTML` to create the HTML, and then passes the result to the Gotenberg service.
- **Dependencies:**
  - `github.com/gin-gonic/gin`: The web framework for handling the API request.
  - `cloud.google.com/go/firestore`: For fetching data from the database.
  - `github.com/gemini/forms-api/internal/services`: To call the `GenerateDynamicHTML` and Gotenberg service functions.

## 4. PDF Conversion Service

- **Gotenberg:** We use a self-hosted Gotenberg instance running on Cloud Run for the final HTML-to-PDF conversion. The communication between our Go backend and the Gotenberg service is secured using HTTPS and Google Cloud service-to-service authentication.

This new workflow provides a robust, scalable, and secure foundation for generating professional and highly-customized medical forms.
