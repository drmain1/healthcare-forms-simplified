# Summary of the Graphical Signature Rendering Issue

**Last Updated:** 2025-08-08

## 1. Problem Statement

Graphical signatures captured via the SurveyJS `signaturepad` widget on the frontend are not being rendered in the final PDF output. The space for the signature is blank, or a placeholder text like "[Signature Captured]" appears, but not the image itself. This issue persists despite multiple attempts to fix the data processing and template logic.

## 2. System Components & Dependencies

The signature data flows through several distinct components:

*   **Frontend:** A React/TypeScript application.
    *   **Dependency:** `survey-react-ui` for rendering the form and capturing user input.
*   **Backend:** A Go (Golang) API server.
    *   **Dependency:** `gin-gonic/gin` as the web framework.
*   **Database:** Google Cloud Firestore.
    *   **Dependency:** `cloud.google.com/go/firestore` for the Go client library.
*   **PDF Generation Service:** An instance of Gotenberg.
    *   **Dependency:** The backend communicates with this service via HTTP requests.
*   **HTML Templating Engine:** The standard Go `html/template` package.

## 3. End-to-End Data Flow

Here is the step-by-step journey of the signature data:

1.  **Capture (Frontend):** A user draws their signature in the `signaturepad` widget in their browser.
2.  **Encoding (Frontend):** The SurveyJS library encodes the signature into a **base64 data URI string** (e.g., `data:image/png;base64,iVBORw0KGgo...`).
3.  **Submission (Frontend):** The `PublicFormFill.tsx` component gathers all form data. The `onComplete` event fires, and the data (including the signature string) is passed to a submission handler.
4.  **Transmission (API Call):** The frontend sends a `POST` request to the `/responses/public` endpoint on the Go backend. The signature is a string value within the `response_data` JSON object.
5.  **Reception & Storage (Backend):** The `CreatePublicFormResponse` handler in `form_responses.go` receives the data. It saves the entire `response_data` map directly to a new document in the `form_responses` Firestore collection. The signature is stored as a standard string.
6.  **PDF Generation Trigger (API Call):** A separate `POST` request is made to the `/api/responses/:responseId/generate-pdf` endpoint.
7.  **Data Retrieval (Backend):** The `GeneratePDFHandler` in `pdf_generator.go` fetches the complete form response data (including the signature string) from Firestore.
8.  **Data Processing (Backend):**
    *   The data is passed to `services.ProcessAndFlattenForm`.
    *   This function recursively processes the form structure and identifies any question with `type: "signaturepad"`.
    *   For each signature, it creates a `VisibleQuestion` struct, populating the `SignatureData` field with the full base64 data URI string.
9.  **HTML Generation (Backend):**
    *   The processed data (`[]VisibleQuestion`) is passed to `services.GenerateHTMLFromTemplate`.
    *   **Crucially, this function uses an *inline string constant* named `pdfTemplate` to generate the HTML.** It does **not** use an external `.html` file.
    *   The template ranges over the questions and is supposed to generate an `<img src="{{.SignatureData}}">` tag.
10. **PDF Conversion (Backend -> Service):** The final HTML string is sent to the Gotenberg service, which converts it into a PDF file.
11. **Response:** The generated PDF is returned to the client.

## 4. Investigation History & Key Findings

*   **Frontend Validation:** An initial issue where the frontend was incorrectly stripping out valid signatures (`isSignatureEmpty` function) was corrected.
*   **Logging & Verification:** Extensive logging was added to both the frontend and backend.
*   **Confirmed Data Integrity:** The logs have **conclusively shown** that the full, valid base64 data URI is being:
    1.  Sent from the browser.
    2.  Received by the backend.
    3.  Stored correctly in Firestore.
    4.  Retrieved correctly from Firestore.
    5.  Processed correctly by `form_processor.go` and placed into the `SignatureData` field.
*   **Root of Confusion:** A major error in the investigation was focusing on the `form_response_professional.html` file. **This file is not used for PDF generation.** The real template is the inline `pdfTemplate` constant in `html_generator.go`.
*   **Current State:** The inline template in `html_generator.go` has been modified to use the `SignatureData` field, but the issue persists.

## 5. Final Resolution

The issue was confirmed to be caused by Go's `html/template` engine auto-escaping the `src` attribute of the `<img>` tag. The engine incorrectly identified the base64 data URI as a potentially malicious script and sanitized it, breaking the image link.

**The fix involved two key changes in `form_processor.go`:**

1.  **Importing `html/template`:** The `html/template` package was added to the imports.
2.  **Changing the Struct Field Type:** The `SignatureData` field in the `VisibleQuestion` struct was changed from `string` to `template.URL`.
3.  **Casting the Data:** When processing a signature, the base64 string was explicitly cast to the `template.URL` type before being assigned to the `SignatureData` field.

This change signals to the templating engine that the content is a known-safe URL, which prevents the auto-escaping and allows the base64 data URI to be rendered correctly in the final PDF.
