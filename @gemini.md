# @gemini.md: AI Agent Project Guide

This document provides a comprehensive overview of the Healthcare Forms Platform, specifically tailored for Gemini AI agents. It reflects the current state of the project based on a recent code scan.

## 🏗️ Architecture Overview

A HIPAA-compliant healthcare forms platform built on Google Cloud Platform (GCP).

### **Tech Stack**

*   **Backend:** **Go (Golang)** with the **Gin** web framework, deployed on **Cloud Run**.
*   **Frontend:** **React + TypeScript** with Material UI, hosted on **Firebase Hosting**.
*   **Database:** **Google Cloud Firestore** (NoSQL).
*   **Authentication:** **Firebase Auth** with Google Sign-In.
*   **AI Services:** **Vertex AI (Gemini Pro)** and **Document AI**.
*   **PDF Generation:** **Gotenberg** service.
*   **CI/CD:** **Google Cloud Build** and **GitHub Actions**.

## 📂 Key Directories

*   `backend-go/`: Contains the Go backend application.
    *   `cmd/server/main.go`: Main application entry point.
    *   `internal/api/`: API route handlers (e.g., forms, auth, pdf).
    *   `internal/data/`: Firestore data models and access logic.
    *   `go.mod`: Backend dependencies.
*   `frontend/`: Contains the React frontend application.
    *   `src/`: Main source code directory.
    *   `src/components/`: Reusable React components.
    *   `src/services/`: Services for interacting with backend APIs and AI platforms.
    *   `package.json`: Frontend dependencies and scripts.
*   `.github/workflows/`: CI/CD workflows for automated checks and deployments.
*   `cloudbuild.yaml`: Google Cloud Build configuration for backend deployment.

## 🚀 Deployment

### **Backend (Cloud Run)**

The Go backend is containerized using Docker and deployed as a service on Cloud Run.

*   **Service Name:** `healthcare-forms-backend-go`
*   **Deployment Trigger:** Pushes to the main branch trigger a build via `cloudbuild.yaml`.
*   **Configuration:** See `cloudbuild.yaml` for environment variables, memory, and CPU settings.

### **Frontend (Firebase Hosting)**

The React frontend is deployed using Firebase Hosting.

*   **Deployment Command:** `firebase deploy --only hosting`
*   **Configuration:** `firebase.json` and `.firebaserc` in the `frontend` directory.

## 🤖 AI Services Integration

The platform heavily integrates with Google's AI services for advanced form processing.

*   **Vertex AI (Gemini Pro):**
    *   **Location:** `frontend/src/services/vertexAIService.ts` and `geminiService.ts`.
    *   **Usage:** Form generation from text, medical term extraction, and field suggestions.
*   **Document AI:**
    *   **Location:** `frontend/src/services/documentAIService.ts`.
    *   **Usage:** Parsing data from uploaded PDFs and images (OCR).

## 📝 Important Notes

1.  **Backend Language:** The backend is **Go**, not Python. The `backend-go` directory and `go.mod` file are the source of truth.
2.  **PHI Data Handling:** All patient health information (PHI) must be encrypted before storage.
3.  **Multi-tenancy:** Firestore queries must be filtered by `organization_id` to ensure data isolation between tenants.
4.  **API Keys:** Secrets and API keys are managed via Google Secret Manager and should never be committed to the repository.
