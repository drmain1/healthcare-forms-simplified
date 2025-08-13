# Multi-stage build for secure Go backend
# Stage 1: Build the Go binary
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod files first (better layer caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build static binary with security flags
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s -extldflags '-static'" \
    -a -installsuffix cgo \
    -o server cmd/server/main.go

# Stage 2: Google Distroless (perfect for GCP)
FROM gcr.io/distroless/static-debian12:nonroot

# Copy the binary
COPY --from=builder /app/server /server

# Copy templates directory (required for pain assessment and form templates)
COPY --from=builder /app/templates /templates

# The nonroot image includes a non-root user by default (65532)
# No need to create one!

EXPOSE 8080

# Run the binary
ENTRYPOINT ["/server"]