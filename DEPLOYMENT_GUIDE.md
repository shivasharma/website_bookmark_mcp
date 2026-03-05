# HTTPS/SSL Deployment Guide

This guide explains how to deploy the Bookmark MCP application with SSL/TLS certificates using Docker and nginx.

## Architecture

```
Internet
    ↓
nginx (Port 443 - HTTPS with SSL/TLS)
    ↓
Docker Container - app:3001 (HTTP internal)
    ↓
PostgreSQL
```

## Prerequisites

1. **Domain**: `ai.shivaprogramming.com` already set up
2. **SSL Certificates**: Let's Encrypt certificates installed on VPS at `/etc/letsencrypt/live/ai.shivaprogramming.com/`
3. **Docker & Docker Compose** installed on VPS
4. **Git** for cloning the repository

## Setup Instructions

### Step 1: Prepare Your VPS

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Navigate to your project directory
cd /path/to/website_bookmark_mcp

# Ensure Let's Encrypt certificates exist
ls -la /etc/letsencrypt/live/ai.shivaprogramming.com/
# Should show: fullchain.pem and privkey.pem
```

### Step 2: Configure Environment Variables

```bash
# Copy the example to .env
cp .env.example .env

# Edit with your actual values
nano .env
```

**Critical values to set:**

```env
# Generate a secure secret key (min 32 characters)
SESSION_SECRET=generate_a_random_string_here_min_32_characters

# Database password
DB_PASSWORD=your_secure_postgres_password

# OAuth credentials (from Google & GitHub)
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
CLIENT_ID_GITHUB=your_id
CLIENT_SECRET_GITHUB=your_secret
```

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
```

### Step 3: Create Required Directories

```bash
# Create certbot directory for certificate renewal
mkdir -p certbot
chmod 755 certbot
```

### Step 4: Deploy with Docker Compose

```bash
# Pull latest images and build
docker-compose pull
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f app nginx

# Verify containers are running
docker-compose ps
```

### Step 5: Verify HTTPS Connection

```bash
# Test HTTP redirect
curl -I http://ai.shivaprogramming.com
# Should return: 301 redirect to https

# Test HTTPS
curl -I https://ai.shivaprogramming.com
# Should return: 200 OK

# Check SSL certificate
curl -v https://ai.shivaprogramming.com 2>&1 | grep -A 5 "certificate"
```

## Security Features

### 1. **SSL/TLS Configuration**
- ✅ TLS 1.2 and 1.3 only (no legacy SSL)
- ✅ Strong ciphers (HIGH:!aNULL:!MD5)
- ✅ HSTS enabled (preload ready)
- ✅ SSL session caching for performance
- ✅ OCSP stapling for certificate validation

### 2. **Security Headers**
- ✅ `Strict-Transport-Security` - Force HTTPS
- ✅ `X-Frame-Options` - Prevent clickjacking
- ✅ `X-Content-Type-Options` - Prevent MIME sniffing
- ✅ `X-XSS-Protection` - XSS protection
- ✅ `Content-Security-Policy` - XSS/Injection prevention
- ✅ `Permissions-Policy` - Restrict browser features

### 3. **Container Security**
- ✅ Container user isolation (`no-new-privileges`)
- ✅ App container only exposes port 3001 internally
- ✅ PostgreSQL only accessible within private network
- ✅ All services on isolated Docker network

### 4. **Production Settings**
- ✅ `ALLOW_LOCAL_FALLBACK=false` - No local test user access
- ✅ `SESSION_COOKIE_SECURE=true` - Secure cookies only
- ✅ `NODE_ENV=production` - Production mode
- ✅ Health checks enabled - Auto-restart on failure
- ✅ Unique container names for easier management

## Certificate Renewal

Let's Encrypt certificates expire after 90 days. Automatic renewal options:

### Option 1: Manual Renewal (Recommended for first test)

```bash
# SSH into VPS
ssh user@your-vps-ip

# Manually renew certificates
sudo certbot renew --force-renewal

# Reload nginx to pick up new certificates
docker-compose exec nginx nginx -s reload
```

### Option 2: Automated Renewal with Cron (Recommended for production)

```bash
# Add to crontab for automatic monthly renewal
sudo crontab -e

# Add this line (runs at 2 AM daily):
0 2 * * * cd /path/to/website_bookmark_mcp && certbot renew && docker-compose exec nginx nginx -s reload >/dev/null 2>&1
```

### Option 3: Certbot Container (Most automated)

Replace the nginx certificate renewal:

```bash
# Install with Docker Certbot container
docker-compose -f docker-compose.yml -f docker-compose.certbot.yml up -d
```

## Monitoring & Logs

### View Application Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx

# Real-time monitoring
docker stats
```

### Common Issues

**Certificate not found:**
```bash
# Verify certificate exists on VPS
ls -la /etc/letsencrypt/live/ai.shivaprogramming.com/

# If missing, create with certbot
sudo certbot certonly --standalone -d ai.shivaprogramming.com
```

**nginx shows permission denied:**
```bash
# Ensure certificates are readable
sudo chmod 644 /etc/letsencrypt/live/ai.shivaprogramming.com/*.pem

# Restart nginx
docker-compose restart nginx
```

**App not accessible:**
```bash
# Check app health
docker-compose exec app curl http://localhost:3001/api/health

# Check network connectivity
docker-compose exec nginx curl http://app:3001/
```

## Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up --build -d

# Verify deployment
docker-compose logs -f app
```

## Backup & Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres bookmark_mcp > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres bookmark_mcp < backup.sql
```

### Full System Backup

```bash
# Backup database volume
docker run --rm -v bookmark_mcp_postgres_data:/data -v $(pwd):/backup \
  busybox tar czf /backup/db-backup.tar.gz /data
```

## Performance Optimization

Current nginx configuration includes:

- ✅ Gzip compression for text/CSS/JS
- ✅ Connection pooling
- ✅ Proxy buffering
- ✅ HTTP/2 support
- ✅ SSL session caching
- ✅ Proper keepalive timeouts

## Troubleshooting

### HTTPS redirect loop
- Check nginx configuration
- Clear browser cache
- Verify X-Forwarded-Proto header

### Certificate validation fails
- Check certificate dates: `certbot certificates`
- Renew early: `certbot renew --force-renewal`
- Verify domain DNS resolves correctly

### Database connection issues
- Check `docker-compose logs postgres`
- Verify `DATABASE_URL` in .env
- Test password: `docker-compose exec postgres psql -U postgres`

### High memory usage
- Reduce worker processes in nginx.conf
- Check for memory leaks in app logs
- Implement pagination for large datasets

## Next Steps

1. ✅ Deploy to production
2. ✅ Monitor logs for 24 hours
3. ✅ Set up automated certificate renewal
4. ✅ Configure backups
5. ✅ Set up monitoring/alerting
6. ✅ Document runbooks for your team

## Support

For issues:
1. Check logs: `docker-compose logs [service]`
2. Verify configuration is correct
3. Test endpoints manually
4. Review security headers at: https://securityheaders.com/?q=ai.shivaprogramming.com

---

**Last Updated**: 2026-03-05
**Deployment Target**: Production VPS with nginx proxy
**SSL Provider**: Let's Encrypt
