# Production Deployment Guide

This directory contains all the necessary configuration files and scripts for deploying the AI-powered learning research platform to production.

## Quick Start

1. **Environment Setup**
   ```bash
   cp .env.server.production .env.server
   cp .env.client.production .env.client
   # Edit both files with your production values
   ```

2. **Docker Deployment**
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

3. **Verify Deployment**
   ```bash
   curl https://yourdomain.com/health
   ```

## File Structure

```
deployment/
├── README.md                    # This file
├── production-config.md         # Detailed configuration guide
├── deployment-checklist.md      # Pre/post deployment checklist
├── monitoring-setup.js          # Monitoring and logging configuration
├── nginx.conf                   # Nginx reverse proxy configuration
├── docker-compose.production.yml # Docker compose for production
├── Dockerfile.production        # Production Docker image
└── backup-scripts/
    ├── backup-database.sh       # PostgreSQL backup script
    ├── backup-vectors.sh        # Qdrant vector backup script
    └── restore-database.sh      # Database restore script
```

## Configuration Files

### Environment Variables

- **`.env.server.production`** - Server-side environment variables template
- **`.env.client.production`** - Client-side environment variables template

Copy these files and fill in your production values:

```bash
cp .env.server.production .env.server
cp .env.client.production .env.client
```

### Docker Configuration

- **`Dockerfile.production`** - Multi-stage Docker build for optimized production image
- **`docker-compose.production.yml`** - Complete production stack with all services

### Web Server Configuration

- **`nginx.conf`** - Production-ready Nginx configuration with:
  - SSL/TLS termination
  - Rate limiting
  - Security headers
  - Static file caching
  - WebSocket support
  - API proxying

## Required Services

### Core Services
1. **PostgreSQL** - Main application database
2. **Qdrant** - Vector database for RAG system
3. **Redis** - Caching and session storage
4. **Nginx** - Reverse proxy and static file serving

### External Services
1. **OpenAI API** - Content generation and embeddings
2. **SearXNG** - Meta search engine for research
3. **AWS S3** - File storage and backups
4. **Sentry** - Error tracking and monitoring

## Deployment Options

### Option 1: Docker Compose (Recommended)

Complete stack deployment with all services:

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop services
docker-compose -f docker-compose.production.yml down
```

### Option 2: Kubernetes

For larger deployments, Kubernetes manifests can be generated from the Docker Compose file:

```bash
# Install kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.28.0/kompose-linux-amd64 -o kompose
chmod +x kompose

# Convert to Kubernetes
./kompose convert -f docker-compose.production.yml
```

### Option 3: Manual Deployment

For custom infrastructure, follow the configuration in `production-config.md`.

## Monitoring and Logging

### Built-in Monitoring

The application includes comprehensive monitoring:

- **Health Checks** - `/health` endpoint for service status
- **Metrics Collection** - Custom metrics for learning platform
- **Structured Logging** - JSON logs with correlation IDs
- **Error Tracking** - Sentry integration for error monitoring

### Optional Monitoring Stack

The Docker Compose includes optional monitoring services:

- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **AlertManager** - Alert routing and management

Enable by uncommenting the monitoring services in `docker-compose.production.yml`.

## Backup and Recovery

### Automated Backups

Backup scripts are included for all critical data:

```bash
# Database backup (daily recommended)
./backup-scripts/backup-database.sh

# Vector database backup (weekly recommended)
./backup-scripts/backup-vectors.sh
```

### Backup Configuration

Configure backup settings in your environment:

```bash
# Backup retention
BACKUP_RETENTION_DAYS=30

# S3 backup storage
AWS_S3_FILES_BUCKET=your-backup-bucket

# Notification webhook
BACKUP_NOTIFICATION_WEBHOOK=https://hooks.slack.com/...
```

### Recovery

```bash
# Restore database from backup
./backup-scripts/restore-database.sh backup_file.dump

# Restore vectors (manual process via Qdrant API)
# See backup-scripts/backup-vectors.sh for restore commands
```

## Security Considerations

### SSL/TLS Configuration

1. **Obtain SSL Certificates**
   ```bash
   # Using Let's Encrypt
   certbot certonly --webroot -w /var/www/certbot -d yourdomain.com
   ```

2. **Configure Certificate Paths**
   Update `nginx.conf` with your certificate paths:
   ```nginx
   ssl_certificate /etc/nginx/ssl/fullchain.pem;
   ssl_certificate_key /etc/nginx/ssl/privkey.pem;
   ```

### Security Headers

The Nginx configuration includes comprehensive security headers:
- HSTS (HTTP Strict Transport Security)
- CSP (Content Security Policy)
- X-Frame-Options
- X-Content-Type-Options

### Rate Limiting

Built-in rate limiting for different endpoints:
- API endpoints: 10 requests/second
- Research endpoints: 2 requests/minute
- Chat endpoints: 30 requests/minute

## Performance Optimization

### Database Optimization

1. **Connection Pooling**
   ```javascript
   // Configured in application
   pool: {
     min: 5,
     max: 20,
     acquireTimeoutMillis: 30000
   }
   ```

2. **Indexes**
   ```sql
   -- Performance indexes are created automatically
   -- See production-config.md for details
   ```

### Caching Strategy

1. **Redis Caching**
   - Topics: 1 hour TTL
   - Vectors: 2 hours TTL
   - Research results: 30 minutes TTL

2. **Static File Caching**
   - Assets: 1 year cache
   - Images: 1 month cache
   - API responses: 5 minutes cache

### CDN Configuration

For optimal performance, configure a CDN:

```nginx
# Add CDN headers
location /static/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header CDN-Cache-Control "public, max-age=31536000";
}
```

## Scaling Considerations

### Horizontal Scaling

1. **Application Servers**
   - Run multiple app containers behind load balancer
   - Use sticky sessions for WebSocket connections

2. **Database Scaling**
   - Read replicas for query scaling
   - Connection pooling and query optimization

3. **Vector Database Scaling**
   - Qdrant clustering for high availability
   - Separate collections for different topics

### Vertical Scaling

Minimum production requirements:
- **CPU**: 4 cores (8 recommended)
- **RAM**: 8GB (16GB recommended)
- **Storage**: 100GB SSD (500GB recommended)
- **Network**: High-speed internet for AI APIs

## Troubleshooting

### Common Issues

1. **Application Won't Start**
   ```bash
   # Check logs
   docker-compose logs app
   
   # Verify environment variables
   docker-compose exec app env | grep -E "(DATABASE_URL|OPENAI_API_KEY|QDRANT_URL)"
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   docker-compose exec postgres psql -U postgres -d learning_platform -c "SELECT 1;"
   ```

3. **Vector Database Issues**
   ```bash
   # Check Qdrant health
   curl http://localhost:6333/health
   
   # List collections
   curl http://localhost:6333/collections
   ```

4. **High Memory Usage**
   ```bash
   # Monitor memory usage
   docker stats
   
   # Check for memory leaks in logs
   docker-compose logs app | grep -i "memory\|heap"
   ```

### Performance Issues

1. **Slow API Responses**
   - Check database query performance
   - Monitor AI API response times
   - Verify Redis cache hit rates

2. **High AI API Costs**
   - Monitor token usage in logs
   - Implement request batching
   - Optimize prompt engineering

### Getting Help

1. **Check Logs**
   ```bash
   # Application logs
   docker-compose logs -f app
   
   # All services
   docker-compose logs -f
   ```

2. **Health Checks**
   ```bash
   # Overall health
   curl https://yourdomain.com/health
   
   # Detailed health
   curl https://yourdomain.com/health/detailed
   ```

3. **Monitoring Dashboards**
   - Grafana: http://localhost:3000
   - Prometheus: http://localhost:9090

## Support

For deployment support:
- Review the deployment checklist
- Check the troubleshooting section
- Consult the production configuration guide
- Contact the development team

---

**Last Updated**: December 2024
**Version**: 1.0.0