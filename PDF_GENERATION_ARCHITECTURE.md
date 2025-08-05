# Proposed PDF Generation Architecture

This document outlines the proposed architecture for a flexible, backend-driven, and AI-enhanced PDF generation system.

## 1. Core Philosophy

The previous approach of converting the live frontend component to PDF proved to be brittle and difficult to maintain due to CSS complexity. The new philosophy is to treat the PDF as a first-class artifact, generated on the backend from raw data, with its layout intelligently designed by an LLM.

This decouples the PDF's appearance from the web UI, allowing for a highly optimized, paper-like output without compromising the mobile or desktop user experience.

## 2. Proposed System Architecture

The system will consist of five main components in a pipeline:

**1. Frontend Trigger:**
   - The user clicks an "Export PDF" button in the web interface.
   - The frontend makes a single, simple API call to the backend: `POST /api/responses/{responseId}/generate-pdf`.
   - No HTML capturing or styling occurs on the frontend.

**2. Backend Orchestrator (Go):**
   - A new Gin handler receives the request.
   - It fetches the necessary documents from Firestore: the form's `surveyJson` and the specific `responseData`.
   - It then passes the `surveyJson` to the LLM Layout Service.

**3. LLM Layout Service (Go):**
   - This is the core of the new system.
   - It takes the `surveyJson` as input.
   - It constructs a detailed prompt, instructing an LLM (e.g., Gemini) to act as an expert document designer.
   - **The Prompt:** "Given the following SurveyJS JSON, design a professional, space-efficient, 4-column PDF layout. Group related items. Return a JSON object that maps each question's `name` to its grid position (row, col) and size (rowSpan, colSpan)."
   - It receives a `pdfLayoutMap` JSON object back from the LLM.

**4. PDF Engine (Go):**
   - This service takes the `responseData` and the LLM-generated `pdfLayoutMap`.
   - It uses a generic, pre-defined HTML template (`paper_form_template.html`) that contains the basic structure and CSS for a grid layout.
   - It iterates through the `pdfLayoutMap`, looks up the corresponding answer in the `responseData`, and injects the question title and answer into the HTML template at the correct grid position.

**5. PDF Renderer (Gotenberg):**
   - The final, perfectly structured HTML is sent to the Gotenberg service.
   - Gotenberg converts the clean HTML into a high-quality PDF, which is then returned to the user.

## 3. Key Advantages

- **Flexibility:** PDF layouts are generated dynamically and can adapt to any form structure without code changes.
- **Maintainability:** The logic is clean and centralized. No more fighting with frontend CSS for print layouts.
- **High-Quality Output:** The final PDF is based on a clean, purpose-built HTML template, ensuring a professional, paper-like appearance.
- **Intelligence:** Leverages an LLM to automate the difficult and tedious task of document layout design.

## 4. Development Plan

As discussed, the initial development will focus on creating a single, ideal "golden path" from a sample form JSON to a beautiful PDF. This involves:

1.  Manually designing the ideal `pdfLayoutMap` for a popular form.
2.  Building the backend PDF Engine to interpret this map and the data.
3.  Once this manual path is working perfectly, we will then build the LLM Layout Service to automate the creation of the `pdfLayoutMap`.
