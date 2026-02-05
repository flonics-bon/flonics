#!/bin/bash

# 4D Flow MRI Visualization - Docker Deployment Script
# This script automates the Docker deployment process

set -e

echo "=========================================="
echo "4D Flow MRI Visualization - Docker Deploy"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

print_success "Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Docker Compose is installed"

# Stop existing containers
echo ""
echo "Stopping existing containers..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true
print_success "Existing containers stopped"

# Build the Docker image
echo ""
echo "Building Docker image..."
if docker-compose build || docker compose build; then
    print_success "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Start containers
echo ""
echo "Starting containers..."
if docker-compose up -d || docker compose up -d; then
    print_success "Containers started successfully"
else
    print_error "Failed to start containers"
    exit 1
fi

# Wait for container to be healthy
echo ""
echo "Waiting for container to be healthy..."
sleep 5

CONTAINER_NAME="flonics-4dflow-visualization"
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker ps --filter "name=$CONTAINER_NAME" --filter "health=healthy" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        print_success "Container is healthy!"
        break
    fi
    
    ATTEMPT=$((ATTEMPT+1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        print_error "Container failed to become healthy"
        docker logs $CONTAINER_NAME
        exit 1
    fi
    
    echo -n "."
    sleep 2
done

# Display status
echo ""
echo "=========================================="
echo "Deployment Status:"
echo "=========================================="
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
print_success "Deployment completed successfully!"
echo ""
echo "Access the application at:"
echo "  → http://localhost:8080"
echo ""
echo "Useful commands:"
echo "  → View logs:    docker logs -f $CONTAINER_NAME"
echo "  → Stop app:     docker-compose down"
echo "  → Restart app:  docker-compose restart"
echo "  → View stats:   docker stats $CONTAINER_NAME"
echo ""
print_warning "Note: WebGPU requires a compatible browser (Chrome 113+, Edge 113+, or Safari TP)"
echo "=========================================="
