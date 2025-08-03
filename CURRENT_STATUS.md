# Project Status: Secure PDF Generation in Docker

**Objective:** Implement a PDF generation service with custom fonts inside a secure, minimal Docker container suitable for a HIPAA-compliant environment.

## Initial State
- **Technology:** Python FastAPI backend using the `WeasyPrint` library to generate PDFs from HTML templates.
- **Requirement:** The service must run in a minimal Docker container with a low vulnerability count.
- **Challenge:** The initial `Dockerfile` using Chainguard/Wolfi base images was failing due to incorrect image tags and syntax errors.

## Investigation & Iteration Summary

We have systematically explored two primary strategies to solve this:

### Strategy 1: WeasyPrint on a Minimal Base (The Original Plan)

1.  **Attempt (Chainguard/Wolfi):** We tried to fix the initial `Dockerfile` but struggled to find the correct, publicly available Chainguard image tags that provided both the Python development tools and the runtime environment. This led to a series of build failures.
2.  **Attempt (Debian Base):** As a workaround, we switched to the official `python:3.11-slim-bookworm` image. 
    - **Result:** The image built successfully.
    - **BLOCKER:** A `trivy` vulnerability scan revealed **21 HIGH/CRITICAL** vulnerabilities in the base OS packages. This is unacceptable for a HIPAA environment.

### Strategy 2: Headless Chrome (Playwright)

Recognizing the complexity and vulnerability surface of the WeasyPrint system dependencies, we pivoted to a headless Chrome strategy.

1.  **Implementation:** The codebase was successfully refactored:
    - `weasyprint` was replaced with `playwright` in `requirements.txt`.
    - The PDF generation service was rewritten to be `async` and use Playwright to print HTML to PDF.
    - The API endpoints were updated to be `async`.
2.  **Attempt (Multi-stage with Chainguard Chrome):** We tried to build an image using `cgr.dev/chainguard/chromium` as a source.
    - **BLOCKER:** This failed due to a `403 Forbidden` error, indicating the image requires a paid Chainguard subscription.
3.  **Attempt (Multi-stage with Google Chrome):** We tried using the public `google/chrome-for-testing` image.
    - **BLOCKER:** This also failed with an authorization error.
4.  **Attempt (Manual Install on Debian):** We reverted to the `python:3.11-slim-bookworm` base and installed `chromium` via `apt-get`.
    - **Result:** The image built successfully.
    - **BLOCKER:** A `trivy` scan revealed **25 HIGH/CRITICAL** vulnerabilities, primarily from Chromium's massive dependency tree. This is also unacceptable.

## Conclusion & Current Status

**The headless Chrome approach, while technically sound, introduces an unacceptably large vulnerability surface when using standard Linux distributions.** The only strategy that aligns with the core security requirement is the original one: **using WeasyPrint on a Chainguard/Wolfi base.**

Our previous failures with this strategy were purely executional (finding the right tags and syntax), not strategic. We have now returned to this superior approach.

**Current State:**
1.  The codebase has been **reverted** to the `WeasyPrint` implementation.
2.  A **new, corrected `Dockerfile`** has been written. It uses the `cgr.dev/chainguard/wolfi-base` runtime and the correct "exec form" syntax (`RUN ["apk", "add", ...]`) to install dependencies, which should resolve all previous build errors.

**Next Step:** The immediate next step is to **run the `docker build` command** on the current, corrected `Dockerfile`. If it succeeds, we will immediately follow up with a `trivy` scan, which we expect to be significantly cleaner and compliant with our security goals.
