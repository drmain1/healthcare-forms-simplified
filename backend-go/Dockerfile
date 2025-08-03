# Stage 1: Build the Go binary
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the application, creating a static binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -ldflags "-s -w" -o /app/main cmd/server/main.go

# Stage 2: Create the final image with Chrome
FROM debian:bookworm-slim

# Set DEBIAN_FRONTEND to noninteractive to avoid prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies for Chrome
RUN apt-get update && apt-get install -y --no-install-recommends chromium && rm -rf /var/lib/apt/lists/*



WORKDIR /app

# Copy the Go binary from the builder stage
COPY --from=builder /app/main /app/main

# Create a non-root user
RUN adduser --system --group nonroot
USER nonroot

# Set the entrypoint
ENTRYPOINT ["/app/main"]