
# Advanced PDF Generation System - Memento - 08-09-2025

This document outlines the architecture and technical decisions behind the dynamic, high-fidelity PDF rendering system for the Healthcare Forms Platform.

## 1. Core Architecture: Dynamic & Layout-Aware

To overcome the limitations of a static template, we have implemented a dynamic rendering engine in the Go backend. This engine is designed to be scalable, maintainable, and capable of producing professional, multi-column PDF layouts from a single form JSON definition.

The architecture is founded on the principle of **separating content from presentation**:

- **Content & Layout (Form JSON):** The SurveyJS JSON file is the single source of truth. It defines the questions and, crucially, contains embedded **layout hints** that instruct the rendering engine on how to structure the visual output.

- **Engine (Go Backend):** The `html_generator.go` service acts as the rendering engine. It parses the form JSON and its layout hints, and programmatically constructs a purpose-built HTML document. It does *not* use a static template file.

- **Presentation (CSS & PDF Service):** The dynamically generated HTML is styled using a dedicated CSS block within the Go template. This CSS uses modern techniques like Grid and Flexbox to create the compact, professional layout. The final HTML is then sent to a Gotenberg service for conversion to PDF.

## 2. Key Technical Decisions & Implementations

Several key features have been implemented to achieve the desired output:

### 2.1. Layout Hints in JSON

To create multi-column layouts, we have introduced custom properties to be added to `panel` elements within the SurveyJS JSON:

- `"layoutColumns": <number>`: When applied to a panel, this renders its child elements in a CSS grid with the specified number of columns.
- `"colSpan": <number>`: When applied to an element within a grid panel, it allows that element to span multiple columns.

### 2.2. Conditional Rendering of Unanswered Questions

To ensure the final PDF is clean and professional, the Go template now conditionally renders questions. 

- **Logic:** An `{{if getAnswer .Name}}...{{end}}` block is wrapped around each question's rendering logic.
- **Function:** The `getAnswer` template function checks if a value exists for a given question's `name` in the response data map.
- **Result:** If no answer is present, the entire HTML for that question is omitted from the output, preventing blank fields from appearing on the PDF.

### 2.3. Rich Text and Signature Rendering

Special handling was implemented to ensure complex data types are rendered correctly and securely.

- **Rich Text (`html` type):**
  - **Problem:** The form JSON contains pre-formatted HTML for compliance sections (e.g., Terms & Conditions).
  - **Solution:** We implemented a `safeHTML` function in the Go template. This function marks the string as `template.HTML`, preventing the Go engine from auto-escaping it and ensuring all tags (`<p>`, `<strong>`, etc.) are rendered correctly.

- **Signatures (`signaturepad` type):**
  - **Problem:** Base64-encoded signature images were being sanitized by the template engine, breaking the `<img>` source.
  - **Solution:** We implemented a `safeURL` function. This function marks the base64 data URI as a `template.URL`, signaling to the engine that it is a safe and valid image source.

### 2.4. Upstream Data Cleaning

- **Problem:** The original form JSON contained inline `style` attributes (e.g., `style="max-height: 300px"`) that were appropriate for a scrolling web view but caused text to be truncated in the PDF.
- **Decision:** The most robust solution was to fix the data at the source. The inline `style` attributes were **removed** from the `html` values in the `fullform.md` file, ensuring the data is clean and that all styling is controlled by our dedicated PDF CSS.

## 3. Key Files & Dependencies

- **`internal/services/html_generator.go`:** The core rendering engine. Contains the Go structs that model the form, the `GenerateDynamicHTML` function, and the master `pdfTemplate` string with all CSS and template logic.
  - **Dependencies:** `encoding/json`, `html/template`.

- **`internal/api/pdf_generator.go`:** The API handler that orchestrates the process. It fetches data from Firestore, calls the `GenerateDynamicHTML` function, and sends the result to the PDF conversion service.
  - **Dependencies:** `gin-gonic/gin`, `cloud.google.com/go/firestore`.

- **`fullform.md`:** The canonical source for the form structure and layout hints.

This dynamic, data-driven approach provides a powerful and flexible system for generating high-quality, professional medical forms that meet all compliance and layout requirements.
