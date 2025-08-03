# Multi-stage build for HIPAA-compliant FastAPI with xhtml2pdf
# Using Chainguard images for a minimal attack surface

# Stage 1: Build stage using a recent, valid Python dev image
FROM cgr.dev/chainguard/python:latest-dev AS builder

WORKDIR /app

# Create install directory
RUN mkdir -p /app/install

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies into a specific location
RUN python -m pip install --no-cache-dir --prefix=/app/install -r requirements.txt

# Stage 2: Runtime stage with a minimal base and matching Python version
FROM cgr.dev/chainguard/wolfi-base:latest

# Install the matching Python version and system dependencies for xhtml2pdf
# This uses the python3 package which corresponds to the `latest` tag
RUN ["apk", "add", "--no-cache", "python-3", "libjpeg-turbo", "libpng"]

WORKDIR /app

# Copy Python packages from the builder stage
COPY --from=builder /app/install /usr/local

# Copy application code
COPY main.py .
COPY models/ ./models/
COPY routers/ ./routers/
COPY services/ ./services/
COPY templates/ ./templates/
COPY static/ ./static/

RUN ["chown", "-R", "nonroot:nonroot", "/app"]

# Switch to the non-root user
USER nonroot

# Set Python path to include installed packages for the correct version
# This path corresponds to the `python-3` package
ENV PATH=/usr/local/bin:$PATH
ENV PYTHONPATH=/usr/local/lib/python3.11/site-packages

EXPOSE 8000

# Use the standard python3 executable
CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
