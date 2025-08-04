# Building and Deploying the Go Backend

This document provides the instructions to build the multi-stage Alpine Docker image for the Go backend, push it to Google Container Registry (GCR), and deploy it to Google Cloud Run.

## 1. Dockerfile

First, ensure you have a file named `Dockerfile.alpine` in the `backend-go` directory with the following content:

```Dockerfile
# Use the official Golang image to create a build artifact.
# This is the "builder" stage.
FROM golang:1.24-alpine AS builder

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source code
COPY . .

# Build the Go app
# -o /app/main: output the executable to /app/main
# -ldflags "-w -s": strip debug information to reduce binary size
RUN CGO_ENABLED=0 GOOS=linux go build -a -ldflags "-w -s" -o /app/main ./cmd/server

# Use a minimal image to run the compiled binary.
# This is the "runner" stage.
FROM alpine:latest

# Add ca-certificates for HTTPS calls
RUN apk --no-cache add ca-certificates

# Set the Current Working Directory inside the container
WORKDIR /root/

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/main .

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
CMD ["./main"]
```

## 2. Build the Docker Image

Run the following command from the root of the project to build the Docker image. The `--platform linux/amd64` flag is crucial for building an image that is compatible with Google Cloud Run.

```bash
docker build --platform linux/amd64 -f backend-go/Dockerfile.alpine -t gcr.io/healthcare-forms-v2/forms-api-go:latest backend-go
```

## 3. Push the Image to GCR

After the build is complete, push the image to Google Container Registry:

```bash
docker push gcr.io/healthcare-forms-v2/forms-api-go:latest
```

## 4. Deploy to Cloud Run

Finally, deploy the image to Cloud Run. This command includes the necessary environment variables for the application to run correctly, including the CORS configuration for both production and local development.

```bash
gcloud run deploy healthcare-forms-backend-go \
  --image gcr.io/healthcare-forms-v2/forms-api-go:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars="GCP_PROJECT_ID=healthcare-forms-v2,CORS_ALLOWED_ORIGINS='https://healthcare-forms-v2.web.app,http://localhost:3000',COOKIE_DOMAIN=healthcare-forms-v2.web.app" \
  --timeout 300 \
  --quiet
```
