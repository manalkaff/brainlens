# BrainLens Setup Guide

This guide provides multiple setup options for running BrainLens depending on your environment and needs.

## 🚀 Quick Start (Full Docker Development)

**Recommended for:** New users, development, testing

All services run in Docker containers - perfect for getting started quickly.

### Prerequisites
- Docker and Docker Compose installed
- Wasp framework installed
- OpenAI API key

### Setup

0. **Install Wasp (if not already installed):**
   ```bash
   curl -sSL https://get.wasp.sh/installer.sh | sh
   ```
1. **Start all services:**
   ```bash
   cd app
   ./start-dev-services.sh
   ```

2. **Configure environment:**
   ```bash
   cp .env.development .env.server
   # Edit .env.server and add your OpenAI API key
   ```

3. **Initialize database:**
   ```bash
   wasp db migrate-dev
   ```

4. **Start BrainLens:**
   ```bash
   wasp start
   ```

### Services Running
- ✅ PostgreSQL: `localhost:5432`
- ✅ Redis: `localhost:6379`
- ✅ Qdrant: `http://localhost:6333`
- ✅ SearXNG: `http://localhost:8080`

---

## 🌐 Production Setup

**Recommended for:** Production deployments, self-hosting

### Option A: Full Docker Production
Use `docker-compose.production.yml` with:
- Nginx reverse proxy
- SSL certificates
- Production optimizations
- Monitoring (Prometheus/Grafana)

### Production Environment Variables
```bash
# Production database
DATABASE_URL=postgresql://user:pass@prod-db:5432/brainlens

# Production vector database
QDRANT_URL=https://your-qdrant-endpoint
QDRANT_API_KEY=your-production-key

# Production cache
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-redis-password

# Production search
SEARXNG_URL=https://your-searxng-domain

# API keys
OPENAI_API_KEY=your-openai-key
STRIPE_API_KEY=your-stripe-key
```

---

## 🔧 Configuration Options

### SearXNG Engines Configuration
Located in `searxng/settings.yml`:

```yaml
# Academic sources
- name: arxiv
- name: google scholar
- name: pubmed

# Computational
- name: wolframalpha

# Video content
- name: youtube

# Community discussions
- name: reddit
- name: stackoverflow
```

### Qdrant Configuration
Located in `qdrant/dev-config.yaml`:

```yaml
# Vector settings for OpenAI embeddings
hnsw_config:
  m: 16
  ef_construct: 100

# Performance
performance:
  max_search_threads: 2
```

---

## 🔍 Health Checking

### Check All Services
```bash
# Docker services
docker-compose -f docker-compose.dev.yml ps

# Individual health checks
curl http://localhost:6333/health        # Qdrant
curl http://localhost:8080/config        # SearXNG
docker-compose -f docker-compose.dev.yml exec redis-dev redis-cli ping  # Redis
```

### BrainLens Health Check
```bash
# From the app
wasp start
# Visit http://localhost:3000/api/health
```

---

## 🐛 Troubleshooting

### Common Issues

**SearXNG not responding:**
```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs searxng

# Restart service
docker-compose -f docker-compose.dev.yml restart searxng
```

**Qdrant connection failed:**
```bash
# Check if running
curl http://localhost:6333/health

# Check collections
curl http://localhost:6333/collections
```

**Database connection failed:**
```bash
# Check PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres-dev pg_isready -U postgres

# Check connection string in .env.server
```

### Logs and Monitoring
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f searxng

# Wasp application
wasp start  # logs appear in terminal
```

---

## 🚦 Next Steps

After successful setup:

1. **Test research functionality:**
   - Create a new topic
   - Start research process
   - Monitor real-time progress

2. **Explore Phase 1 features:**
   - Multi-agent search
   - Vector storage
   - Real-time streaming
   - Content aggregation

3. **Proceed to Phase 2:**
   - Enhanced content pipeline
   - Learning interface improvements
   - Advanced RAG features

---

## 📞 Support

- **Documentation:** Check `/docs` folder
- **Issues:** Report on GitHub
- **Logs:** Always check service logs first

Choose the setup option that best fits your environment and requirements!