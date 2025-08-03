# Font Setup Documentation for HIPAA-Compliant PDF Generation

## Executive Summary
This document details our implementation of self-hosted variable weight fonts in a HIPAA-compliant Docker container using Chainguard minimal images for PDF generation via WeasyPrint.

## Current Setup

### Font Choice: Bitter Variable Font
- **Font Family**: Bitter (Google Fonts)
- **Files**:
  - `Bitter-VariableFont_wght.ttf` (290KB) - Regular variant, weights 100-900
  - `Bitter-Italic-VariableFont_wght.ttf` (290KB) - Italic variant, weights 100-900
- **Location**: `/backend-fastapi/static/fonts/`
- **Why Variable Fonts**: Single file supports all weights (100-900), reducing image size while providing full typographic flexibility

### Font Weight Implementation
We've implemented a sophisticated weight hierarchy for optimal document readability:

| Weight | Usage | CSS Classes |
|--------|-------|-------------|
| 700 | Main titles, clinic name | `.clinic-name` |
| 650 | Section headers, question numbers | `h2`, `.question-number` |
| 600 | Required badges | `.required-badge` |
| 550 | Question titles, field labels | `.question-title`, `.field label` |
| 500 | Form type, rating options | `.form-type`, `.rating-option` |
| 450 | Form answers, metadata | `.question-answer`, `.patient-info p` |
| 425 | AI summary content | `.summary-content` |
| 400 | Regular body text | `body` (default) |

### Directory Structure
```
backend-fastapi/
├── static/
│   └── fonts/
│       ├── Bitter-VariableFont_wght.ttf
│       ├── Bitter-Italic-VariableFont_wght.ttf
│       └── fontconfig.xml
├── templates/
│   └── pdf/
│       ├── styles/
│       │   ├── base.css (contains @font-face declarations)
│       │   └── medical.css (uses font weights)
│       ├── response_form.html
│       └── blank_form.html
└── services/
    └── pdf_generator.py
```

## Dockerfile Configuration

### Current Issues and Challenges

#### 1. Python Version Mismatch
**Problem**: The builder stage uses `cgr.dev/chainguard/python:latest-dev` while runtime uses `python-3.13` package from wolfi-base.

**Issue**: 
- `latest-dev` could be any Python version (3.11, 3.12, or 3.13)
- Packages compiled with one Python version may not work with another
- This causes potential runtime errors

**Attempted Fix**:
```dockerfile
FROM cgr.dev/chainguard/python:3.13-dev AS builder
```
**Result**: Tag `3.13-dev` doesn't exist in Chainguard registry

#### 2. Incomplete fontconfig Command
**Problem**: Line 52 has truncated command `fc-ca` instead of `fc-cache -fv`

**Current**:
```dockerfile
RUN mkdir -p /etc/fonts/conf.d && \
    echo '<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>/app/static/fonts</dir></fontconfig>' > /etc/fonts/conf.d/99-custom-fonts.conf && \
    fc-ca
```

**Should be**:
```dockerfile
RUN mkdir -p /etc/fonts/conf.d && \
    echo '<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>/app/static/fonts</dir></fontconfig>' > /etc/fonts/conf.d/99-custom-fonts.conf && \
    fc-cache -fv
```

### Complete Current Dockerfile
```dockerfile
# Multi-stage build for HIPAA-compliant FastAPI with WeasyPrint
# Using Chainguard images for security

# Stage 1: Build stage using Python 3.13 dev image
FROM cgr.dev/chainguard/python:3.13-dev AS builder  # ⚠️ This tag doesn't exist

WORKDIR /app

# Create install directory
RUN mkdir -p /app/install

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies in a specific location
RUN pip install --no-cache-dir --prefix=/app/install -r requirements.txt

# Stage 2: Runtime stage with minimal attack surface
FROM cgr.dev/chainguard/wolfi-base:latest

# Install all required system dependencies for WeasyPrint and Python 3.13
RUN apk add --no-cache \ 
    python-3.13 \ 
    pango \ 
    cairo \ 
    glib \ 
    harfbuzz \ 
    fontconfig \ 
    gdk-pixbuf \ 
    font-noto

WORKDIR /app

# Copy Python packages from builder
COPY --from=builder /app/install /usr/local

# Copy application code
COPY main.py .
COPY models/ ./models/
COPY routers/ ./routers/
COPY services/ ./services/
COPY templates/ ./templates/
COPY static/ ./static/

# Create non-root user
RUN adduser -D -u 1001 nonroot || true

# Configure fontconfig to find our custom fonts
RUN mkdir -p /etc/fonts/conf.d && \
    echo '<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>/app/static/fonts</dir></fontconfig>' > /etc/fonts/conf.d/99-custom-fonts.conf && \
    fc-cache -fv  # ⚠️ Currently truncated as "fc-ca"

# Change ownership to non-root user
RUN chown -R nonroot:nonroot /app

# Switch to non-root user
USER nonroot

# Set Python path
ENV PATH=/usr/local/bin:$PATH
ENV PYTHONPATH=/usr/local/lib/python3.13/site-packages

EXPOSE 8000

CMD ["python3.13", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Recommended Solutions

### Option 1: Use Consistent Python Versions
```dockerfile
# Use latest-dev for both stages and detect version
FROM cgr.dev/chainguard/python:latest-dev AS builder
# ... build stage ...

FROM cgr.dev/chainguard/wolfi-base:latest
# Install the same Python version (need to determine from builder)
RUN apk add --no-cache python-3 pango cairo glib harfbuzz fontconfig gdk-pixbuf font-noto
```

### Option 2: Use Fixed Python Version Available in Both
Research which Python versions have both dev and runtime images available in Chainguard, then use those specific tags.

### Option 3: Use Python Base Image for Runtime
```dockerfile
FROM cgr.dev/chainguard/python:latest-dev AS builder
# ... build stage ...

FROM cgr.dev/chainguard/python:latest  # Use Python runtime image instead of wolfi-base
RUN apk add --no-cache pango cairo glib harfbuzz fontconfig gdk-pixbuf font-noto
```

## Font Configuration Details

### CSS Implementation
```css
/* base.css */
@font-face {
    font-family: 'Bitter';
    src: url('../../static/fonts/Bitter-VariableFont_wght.ttf') format('truetype');
    font-weight: 100 900;
    font-style: normal;
}

@font-face {
    font-family: 'Bitter';
    src: url('../../static/fonts/Bitter-Italic-VariableFont_wght.ttf') format('truetype');
    font-weight: 100 900;
    font-style: italic;
}

body {
    font-family: "Bitter", "Noto Serif", serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #333;
    font-weight: 400;
}
```

### WeasyPrint Integration
- **Font Configuration**: Using `FontConfiguration()` object
- **Base URL**: Set to backend root for proper font path resolution
- **Font Loading**: Relies on system fontconfig to find fonts

### Security Considerations
1. **Self-Hosted Fonts**: No external requests to Google Fonts API (HIPAA compliance)
2. **Minimal Attack Surface**: Using Chainguard images
3. **Non-Root User**: Running as UID 1001 (nonroot)
4. **No Package Manager**: Production image has no apk/apt after build

## Testing

### Test Script Available
`backend-fastapi/test_font_weights.py` - Generates sample PDFs with all font weights

### Verification Steps
1. Build Docker image
2. Run container
3. Generate test PDFs
4. Verify font rendering at different weights
5. Check no external font requests are made

## Known Issues

1. **Docker Build Fails**: Due to non-existent `cgr.dev/chainguard/python:3.13-dev` tag
2. **Fontconfig Command Truncated**: `fc-ca` should be `fc-cache -fv`
3. **Python Version Mismatch**: Builder and runtime stages may use different Python versions

## Recommendations for Specialist Review

1. **Determine Available Chainguard Tags**: Check which Python version tags are available for both dev and runtime
2. **Consider Single-Stage Build**: If security allows, might simplify to single stage with Python runtime image
3. **Alternative Font Solution**: Consider if fonts should be baked into image or mounted as volume
4. **Font Licensing**: Verify Bitter font license is appropriate for healthcare use
5. **Fallback Strategy**: Ensure Noto fonts work as fallback if Bitter fails to load

## Questions for Specialist

1. Which Chainguard Python tags are approved for use?
2. Is the current fontconfig approach optimal for WeasyPrint?
3. Should we consider alternative fonts with better Docker/container support?
4. Are there specific HIPAA requirements for font rendering we should consider?
5. Should font files be included in the image or mounted separately?

## Appendix: File Sizes

- Bitter-VariableFont_wght.ttf: 290KB
- Bitter-Italic-VariableFont_wght.ttf: 290KB
- Total font overhead: ~580KB
- Supports weights 100-900 without additional files

---

*Document prepared for specialist review of font implementation in HIPAA-compliant PDF generation system using Chainguard minimal containers.*