#!/bin/bash

# BrainLens Development Environment Startup Script
# This script starts all required services for development

set -e

echo "🧠 Starting BrainLens Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is running"

# Check if docker-compose.dev.yml exists
if [ ! -f "docker-compose.dev.yml" ]; then
    print_error "docker-compose.dev.yml not found. Make sure you're in the app directory."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.dev.yml down --remove-orphans

# Start services
echo "🚀 Starting development services..."
docker compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."

# Wait for PostgreSQL
echo "   Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker compose -f docker-compose.dev.yml exec -T postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
        break
    fi
    sleep 2
done

# Wait for Redis
echo "   Waiting for Redis..."
for i in {1..30}; do
    if docker compose -f docker-compose.dev.yml exec -T redis-dev redis-cli ping > /dev/null 2>&1; then
        break
    fi
    sleep 2
done

# Wait for Qdrant
echo "   Waiting for Qdrant..."
for i in {1..30}; do
    if curl -f http://localhost:6333/health > /dev/null 2>&1; then
        break
    fi
    sleep 2
done

# Wait for SearXNG
echo "   Waiting for SearXNG..."
for i in {1..60}; do
    if curl -f http://localhost:8080/config > /dev/null 2>&1; then
        break
    fi
    sleep 3
done

# Check service health
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker compose -f docker-compose.dev.yml exec -T postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
    print_status "PostgreSQL is ready"
else
    print_error "PostgreSQL is not responding"
fi

# Check Redis
if docker compose -f docker-compose.dev.yml exec -T redis-dev redis-cli ping > /dev/null 2>&1; then
    print_status "Redis is ready"
else
    print_error "Redis is not responding"
fi

# Check Qdrant
if curl -f http://localhost:6333/health > /dev/null 2>&1; then
    print_status "Qdrant is ready"
else
    print_error "Qdrant is not responding"
fi

# Check SearXNG
if curl -f http://localhost:8080/config > /dev/null 2>&1; then
    print_status "SearXNG is ready"
else
    print_warning "SearXNG may not be fully ready yet (this is normal on first startup)"
fi

echo ""
echo "🎉 Development services are running!"
echo ""
echo "📊 Service URLs:"
echo "   PostgreSQL:   localhost:5432"
echo "   Redis:        localhost:6379"
echo "   Qdrant:       http://localhost:6333"
echo "   SearXNG:      http://localhost:8080"
echo ""
echo "🔧 Next steps:"
echo "   1. Copy .env.development to .env.server and update with your API keys"
echo "   2. Run 'wasp db migrate-dev' to setup database schema"
echo "   3. Run 'wasp start' to start the application"
echo ""
echo "🛑 To stop services: docker compose -f docker-compose.dev.yml down"
echo "📝 To view logs: docker compose -f docker-compose.dev.yml logs -f [service-name]"
