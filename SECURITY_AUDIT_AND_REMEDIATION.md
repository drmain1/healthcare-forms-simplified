# Security Audit and Remediation Plan

## 1. Executive Summary

This audit of the Healthcare Forms application was conducted to identify potential HIPAA compliance violations and security weaknesses prior to containerization.

The application has a strong foundation, particularly on the backend, with robust tenant isolation and detailed documentation. However, several critical vulnerabilities were identified that violate HIPAA principles and must be remediated.

**Key Findings:**
- **Critical:** The backend API allows for the modification and deletion of PHI-containing form responses, violating the principle of data immutability for audit trails.
- **High:** The frontend application stores sensitive user and organization PII (Potentially PHI) in the browser's `localStorage`, which is insecure.
- **Medium:** The logout process fails to clear all PHI from the application's in-memory state, posing a data leakage risk.

This document provides a detailed remediation plan for each finding, followed by a set of instructions for creating secure, minimal container images using Chainguard for both the frontend and backend services.

---

## 2. Vulnerability Details & Remediation Plan

### V-01: Mutable PHI in Backend API

- **Risk:** Critical
- **Location:** `backend-fastapi/routers/form_responses.py`
- **Description:** The API exposes `PUT` and `DELETE` endpoints for `/responses/{response_id}`. This allows PHI to be modified or permanently deleted, which directly contradicts the immutability required for a HIPAA-compliant audit trail. The backend code, running with administrative privileges, bypasses the more restrictive Firestore security rules.

#### **Remediation Steps:**

1.  **Disable Endpoints:** The most secure action is to completely remove the `update_response` and `delete_response` functions from `backend-fastapi/routers/form_responses.py`.
2.  **Implement a "Cancel/Archive" Flow (If Deletion is Necessary):** If business requirements mandate a way to "remove" a response, do not delete the record. Instead, implement a soft-delete or archival process:
    -   Add a new `status` field to the `FormResponse` model (e.g., `status: str` with values like 'submitted', 'archived', 'error').
    -   Create a new, specific endpoint like `POST /responses/{response_id}/archive`.
    -   This endpoint should not modify the `data` field. It should only change the `status` to `'archived'` and record who performed the action and when (e.g., `archived_by: str`, `archived_at: datetime`).
    -   Update the `list_responses` endpoint to filter out archived responses by default.

---

### V-02: PII/PHI in Browser `localStorage`

- **Risk:** High
- **Location:** `frontend/src/store/slices/authSlice.ts`
- **Description:** The `loginSuccess` reducer writes the entire `user` and `organization` objects into `localStorage`. These objects contain PII such as email, name, phone number, and address, which is a violation of HIPAA's security rule against storing PHI in insecure locations.

#### **Remediation Steps:**

1.  **Remove `localStorage.setItem` calls:** In `frontend/src/store/slices/authSlice.ts`, delete the following lines from the `loginSuccess` reducer:
    ```typescript
    localStorage.setItem('user', JSON.stringify(action.payload.user));
    localStorage.setItem('organization', JSON.stringify(action.payload.organization));
    ```
2.  **Remove `localStorage.getItem` calls:** In the `initialState` for `authSlice`, change the initialization of `user` and `organization` to `null`:
    ```typescript
    const initialState: AuthState = {
      user: null, // Was: JSON.parse(localStorage.getItem('user') || 'null'),
      organization: null, // Was: JSON.parse(localStorage.getItem('organization') || 'null'),
      isAuthenticated: false,
      // ... rest of the state
    };
    ```
3.  **Rely on Session Restoration:** The application should rely on Firebase's own session management (`onAuthStateChanged`) to restore the user's session on page load. The `AuthInitializer.tsx` component should be updated to fetch the user and organization data from the backend API after Firebase confirms an authenticated session, and then populate the Redux store.

---

### V-03: Incomplete PHI Wipe on Logout

- **Risk:** Medium
- **Location:** `frontend/src/components/Common/Layout.tsx` and `frontend/src/utils/sessionTimeout.ts`
- **Description:** The logout process, whether triggered manually or by session timeout, dispatches the `logout()` action from `authSlice` but fails to dispatch the `clearPatientData()` action from `patientSlice`. This leaves sensitive patient PHI in the Redux store's memory, accessible until the page is fully reloaded.

#### **Remediation Steps:**

1.  **Create a Composite Logout Action:** To ensure all necessary cleanup occurs, create a thunk or a saga that orchestrates the logout process.
    -   In a new file, e.g., `frontend/src/store/actions/authActions.ts`, create a thunk:
        ```typescript
        import { logout } from '../slices/authSlice';
        import { clearPatientData } from '../slices/patientSlice';
        import { AppThunk } from '../index';

        export const fullLogout = (): AppThunk => async (dispatch) => {
          // Dispatch all cleanup actions
          dispatch(clearPatientData());
          dispatch(logout());
          // Any other cleanup can be added here
        };
        ```
2.  **Update Call Sites:** Replace all calls to `dispatch(logout())` with the new thunk.
    -   In `frontend/src/components/Common/Layout.tsx`, change `dispatch(logout())` to `dispatch(fullLogout())`.
    -   In `frontend/src/utils/sessionTimeout.ts`, change `store.dispatch(logout())` to `store.dispatch(fullLogout())`.

---

## 3. Containerization Plan (Chainguard)

Instructions for creating secure, minimal Docker images.

### Backend Dockerfile (`backend-fastapi/Dockerfile`)

This multi-stage build ensures the final image is minimal and secure, containing only the application and its runtime dependencies.

```dockerfile
# ---- Builder Stage ----
# Use a secure, minimal Python image from Chainguard
FROM cgr.dev/chainguard/python:3.11-dev as builder

# Set working directory
WORKDIR /app

# Install poetry for dependency management
RUN python -m pip install poetry

# Copy only the files needed for dependency installation
COPY poetry.lock pyproject.toml ./

# Install dependencies into a virtual environment
# This caches the layer and speeds up subsequent builds
RUN poetry config virtualenvs.in-project true && \
    poetry install --no-root --no-dev

# ---- Runner Stage ----
# Use the corresponding minimal Python runtime image from Chainguard
FROM cgr.dev/chainguard/python:3.11

# Set non-root user for security
USER nonroot

WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /app/.venv ./.venv

# Activate the virtual environment
ENV PATH="/app/.venv/bin:$PATH"

# Copy application source code
COPY . .

# Expose the port the application will run on
EXPOSE 8000

# Command to run the application using uvicorn
# Use --host 0.0.0.0 to make it accessible from outside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile (`frontend/Dockerfile`)

This multi-stage build compiles the React application into static assets and serves them with a secure, minimal Nginx server from Chainguard.

```dockerfile
# ---- Builder Stage ----
# Use a secure, minimal Node.js image from Chainguard
FROM cgr.dev/chainguard/node:20-dev as builder

WORKDIR /app

# Copy package.json and lockfile
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the production-ready static assets
# The build script should place assets in the 'build' directory
RUN yarn build

# ---- Runner Stage ----
# Use the secure, minimal Nginx image from Chainguard
FROM cgr.dev/chainguard/nginx:latest

# Set non-root user (nginx image does this by default, but good to be explicit)
USER nginx

# Copy the static assets from the builder stage to the Nginx html directory
COPY --from=builder /app/build /usr/share/nginx/html

# (Optional) Copy a custom Nginx configuration if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# The default command for the nginx image is to start the server.
CMD ["nginx", "-g", "daemon off;"]