# Production Deployment Configuration

This document outlines the production deployment configuration for the AI-powered learning research platform.

## Environment Variables

### Required AI APIs

```bash
# OpenAI API for content generation and embeddings
OPENAI_API_KEY=sk-proj-...
# Required for: Content generation, embeddings, chat responses

# Alternative AI providers (optional)
ANTHROPIC_API_KEY=sk-ant-...
# For Claude models as backup/alternative
```

### Vector Database Configuration

```bash
# Qdrant Vector Database (Production)
QDRANT_URL=https://your-qdrant-cluster.qdrant.io
QDRANT_API_KEY=your-production-api-key
QDRANT_COLLECTION_NAME=learning_platform_vectors

# Alternative: Pinecone (if using instead of Qdrant)
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=your-environment
PINECONE_INDEX_NAME=learning-platform
```

### Search Engine Configuration

```bash
# SearXNG Instance for research pipeline
SEARXNG_BASE_URL=https://your-searxng-instance.com
SEARXNG_API_KEY=your-api-key-if-required

# Alternative search providers
GOOGLE_SEARCH_API_KEY=your-google-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
```

### Caching and Performance

```bash
# Redis for caching (production)
REDIS_URL=redis://your-redis-instance:6379
REDIS_PASSWORD=your-redis-password

# Cache configuration
CACHE_TTL_TOPICS=3600
CACHE_TTL_VECTORS=7200
CACHE_TTL_RESEARCH=1800
```

### Monitoring and Logging

```bash
# Application monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info

# Performance monitoring
NEW_RELIC_LICENSE_KEY=your-new-relic-key
NEW_RELIC_APP_NAME=learning-platform-prod

# Custom logging
LOG_RESEARCH_PIPELINE=true
LOG_VECTOR_OPERATIONS=true
LOG_USER_INTERACTIONS=true
```

### Rate Limiting and Quotas

```bash
# API rate limiting
RATE_LIMIT_RESEARCH_PER_HOUR=10
RATE_LIMIT_CHAT_PER_MINUTE=30
RATE_LIMIT_QUIZ_PER_HOUR=50

# Resource quotas
MAX_CONCURRENT_RESEARCH=5
MAX_VECTOR_STORAGE_MB=1000
MAX_TOPIC_DEPTH=3
```

## Infrastructure Requirements

### Minimum Production Requirements

- **CPU**: 4 cores minimum, 8 cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 100GB SSD minimum
- **Network**: High-speed internet for AI API calls

### Recommended Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Server    │    │   Database      │
│   (nginx/ALB)   │────│   (Node.js)     │────│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Vector DB     │    │   Cache         │
                       │   (Qdrant)      │    │   (Redis)       │
                       └─────────────────┘    └─────────────────┘
```

## Database Configuration

### PostgreSQL Production Settings

```sql
-- Recommended PostgreSQL configuration for production
-- Add to postgresql.conf

# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection settings
max_connections = 100
shared_preload_libraries = 'pg_stat_statements'

# Logging
log_statement = 'mod'
log_min_duration_statement = 1000
```

### Database Indexes for Performance

```sql
-- Additional indexes for learning platform performance
CREATE INDEX CONCURRENTLY idx_topics_slug_status ON "Topic" (slug, status);
CREATE INDEX CONCURRENTLY idx_user_progress_user_topic ON "UserTopicProgress" (userId, topicId);
CREATE INDEX CONCURRENTLY idx_messages_thread_created ON "Message" (threadId, createdAt);
CREATE INDEX CONCURRENTLY idx_vector_docs_topic ON "VectorDocument" (topicId);
CREATE INDEX CONCURRENTLY idx_quiz_user_completed ON "Quiz" (userId, completed, completedAt);
```

## Vector Database Setup

### Qdrant Production Configuration

```yaml
# qdrant-config.yaml
service:
  host: 0.0.0.0
  http_port: 6333
  grpc_port: 6334

storage:
  # Use persistent storage in production
  storage_path: /qdrant/storage
  
cluster:
  # Enable clustering for high availability
  enabled: true
  
telemetry:
  # Disable telemetry in production
  disabled: true

log_level: INFO
```

### Collection Configuration

```javascript
// Vector collection setup for production
const collectionConfig = {
  name: "learning_platform_vectors",
  vectors: {
    size: 1536, // OpenAI text-embedding-3-small dimension
    distance: "Cosine"
  },
  optimizers_config: {
    default_segment_number: 2,
    max_segment_size: 20000,
    memmap_threshold: 50000,
    indexing_threshold: 20000,
    flush_interval_sec: 30,
    max_optimization_threads: 2
  },
  replication_factor: 2, // For high availability
  write_consistency_factor: 1
};
```

## Monitoring and Alerting

### Health Check Endpoints

```javascript
// Health check configuration
const healthChecks = {
  '/health': {
    database: true,
    vectorDb: true,
    redis: true,
    aiApis: true
  },
  '/health/detailed': {
    components: [
      'postgresql',
      'qdrant',
      'redis',
      'openai',
      'research-pipeline'
    ]
  }
};
```

### Monitoring Metrics

```bash
# Key metrics to monitor
- API response times (research, chat, quiz)
- Vector search performance
- Database query performance
- AI API usage and costs
- User session duration
- Error rates by component
- Memory and CPU usage
- Cache hit rates
```

### Alerting Rules

```yaml
# Example alerting configuration
alerts:
  - name: "High API Response Time"
    condition: "avg_response_time > 5000ms"
    severity: "warning"
    
  - name: "Vector DB Connection Failed"
    condition: "qdrant_connection_failed"
    severity: "critical"
    
  - name: "High AI API Costs"
    condition: "daily_ai_cost > $100"
    severity: "warning"
    
  - name: "Research Pipeline Failures"
    condition: "research_failure_rate > 10%"
    severity: "critical"
```

## Security Configuration

### API Security

```bash
# Security headers and CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECURITY_HEADERS_ENABLED=true
RATE_LIMITING_ENABLED=true

# API key rotation
OPENAI_API_KEY_ROTATION_DAYS=90
VECTOR_DB_KEY_ROTATION_DAYS=180
```

### Data Protection

```bash
# Encryption settings
DATABASE_ENCRYPTION_ENABLED=true
VECTOR_DATA_ENCRYPTION=true
BACKUP_ENCRYPTION_KEY=your-backup-encryption-key

# Privacy settings
USER_DATA_RETENTION_DAYS=365
ANONYMOUS_ANALYTICS_ONLY=true
GDPR_COMPLIANCE_MODE=true
```

## Backup and Recovery

### Database Backup Strategy

```bash
#!/bin/bash
# Daily backup script for PostgreSQL
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --format=custom \
  --compress=9 \
  --file="/backups/learning_platform_$(date +%Y%m%d_%H%M%S).dump"

# Upload to S3 or similar
aws s3 cp /backups/ s3://your-backup-bucket/database/ --recursive
```

### Vector Database Backup

```bash
#!/bin/bash
# Qdrant backup script
curl -X POST "http://qdrant:6333/collections/learning_platform_vectors/snapshots" \
  -H "api-key: $QDRANT_API_KEY"

# Download and store snapshot
curl -X GET "http://qdrant:6333/collections/learning_platform_vectors/snapshots/{snapshot_name}" \
  -H "api-key: $QDRANT_API_KEY" \
  -o "/backups/vectors_$(date +%Y%m%d).snapshot"
```

### Recovery Procedures

```bash
# Database recovery
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --clean --if-exists \
  /backups/learning_platform_backup.dump

# Vector database recovery
curl -X PUT "http://qdrant:6333/collections/learning_platform_vectors/snapshots/upload" \
  -H "api-key: $QDRANT_API_KEY" \
  -F "snapshot=@/backups/vectors_backup.snapshot"
```

## Performance Optimization

### Application-Level Optimizations

```javascript
// Production optimizations
const productionConfig = {
  // Connection pooling
  database: {
    pool: {
      min: 5,
      max: 20,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 600000
    }
  },
  
  // Caching strategy
  cache: {
    topics: { ttl: 3600 }, // 1 hour
    vectors: { ttl: 7200 }, // 2 hours
    research: { ttl: 1800 } // 30 minutes
  },
  
  // AI API optimization
  ai: {
    maxConcurrentRequests: 10,
    requestTimeout: 30000,
    retryAttempts: 3,
    backoffMultiplier: 2
  }
};
```

### CDN Configuration

```nginx
# nginx configuration for static assets
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Content-Type-Options nosniff;
}

location /api/ {
    proxy_pass http://backend;
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$request_uri$request_body";
}
```

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] Vector database collections created
- [ ] SSL certificates installed
- [ ] Monitoring systems configured
- [ ] Backup procedures tested
- [ ] Load testing completed
- [ ] Security scan passed

### Post-Deployment

- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Performance metrics baseline established
- [ ] Backup verification completed
- [ ] User acceptance testing
- [ ] Documentation updated
- [ ] Team training completed

## Cost Optimization

### AI API Cost Management

```bash
# Cost monitoring and limits
OPENAI_MONTHLY_BUDGET=1000
COST_ALERT_THRESHOLD=800
USAGE_TRACKING_ENABLED=true

# Optimization settings
EMBEDDING_BATCH_SIZE=100
CONTENT_GENERATION_MAX_TOKENS=2000
RESEARCH_TIMEOUT_SECONDS=300
```

### Resource Scaling

```yaml
# Auto-scaling configuration
scaling:
  min_instances: 2
  max_instances: 10
  target_cpu_utilization: 70
  scale_up_cooldown: 300
  scale_down_cooldown: 600
```

This configuration ensures a robust, scalable, and secure production deployment of the AI-powered learning research platform.