# Docker Deployment Guide for 4D Flow MRI Visualization

This document provides comprehensive instructions for deploying the 4D Flow MRI WebGPU Visualization application using Docker.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose v2.0+ installed
- WebGPU-compatible browser (Chrome 113+, Edge 113+, Safari Technology Preview)
- GPU with WebGPU support

## Quick Start

### Automated Deployment (Recommended)

```bash
# Make the deployment script executable
chmod +x docker-deploy.sh

# Run the deployment script
./docker-deploy.sh
```

The script will:
1. Check Docker and Docker Compose installation
2. Stop any existing containers
3. Build the Docker image
4. Start the container
5. Verify health status
6. Display access information

### Manual Deployment

#### 1. Build the Docker Image

```bash
docker build -t flonics-4dflow-viz .
```

#### 2. Run with Docker

```bash
docker run -d \
  --name flonics-4dflow-visualization \
  -p 8080:80 \
  --restart unless-stopped \
  flonics-4dflow-viz
```

#### 3. Run with Docker Compose

```bash
# Start in detached mode
docker-compose up -d

# Or start with logs
docker-compose up
```

## Accessing the Application

Once deployed, access the visualization at:

- **Local:** http://localhost:8080
- **Network:** http://<your-ip>:8080

## Docker Configuration Details

### Dockerfile Features

- **Base Image:** nginx:alpine (lightweight)
- **WebGPU Headers:** Custom nginx configuration with required security headers
- **Health Check:** Built-in container health monitoring
- **Optimization:** Multi-stage build for minimal image size

### Security Headers

The nginx configuration includes essential WebGPU security headers:

```nginx
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
```

### Port Configuration

- **Container Port:** 80 (nginx)
- **Host Port:** 8080 (configurable in docker-compose.yml)

To change the host port, edit `docker-compose.yml`:

```yaml
ports:
  - "3000:80"  # Change 3000 to your desired port
```

## Container Management

### View Logs

```bash
# Follow logs in real-time
docker logs -f flonics-4dflow-visualization

# View last 100 lines
docker logs --tail 100 flonics-4dflow-visualization
```

### Check Container Status

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# View container details
docker inspect flonics-4dflow-visualization
```

### Monitor Resources

```bash
# Real-time resource usage
docker stats flonics-4dflow-visualization

# One-time snapshot
docker stats --no-stream flonics-4dflow-visualization
```

### Stop and Remove

```bash
# Stop the container
docker stop flonics-4dflow-visualization

# Remove the container
docker rm flonics-4dflow-visualization

# Stop and remove with docker-compose
docker-compose down

# Stop, remove, and clean volumes
docker-compose down -v
```

### Restart

```bash
# Restart single container
docker restart flonics-4dflow-visualization

# Restart with docker-compose
docker-compose restart
```

## Updating the Application

### Method 1: Rebuild and Replace

```bash
# Stop and remove existing container
docker-compose down

# Rebuild the image
docker-compose build

# Start new container
docker-compose up -d
```

### Method 2: Use Deployment Script

```bash
./docker-deploy.sh
```

## Volume Mounting for Development

For live code updates during development, mount local files:

```yaml
volumes:
  - ./index.html:/usr/share/nginx/html/index.html:ro
  - ./flowVisualization.js:/usr/share/nginx/html/flowVisualization.js:ro
```

Or with docker run:

```bash
docker run -d \
  -p 8080:80 \
  -v $(pwd)/index.html:/usr/share/nginx/html/index.html:ro \
  -v $(pwd)/flowVisualization.js:/usr/share/nginx/html/flowVisualization.js:ro \
  flonics-4dflow-viz
```

## Troubleshooting

### Container Won't Start

1. Check if port 8080 is already in use:
```bash
lsof -i :8080  # Linux/Mac
netstat -ano | findstr :8080  # Windows
```

2. Check Docker logs:
```bash
docker logs flonics-4dflow-visualization
```

### WebGPU Not Working

1. Verify browser compatibility:
   - Chrome/Edge 113+ or Canary builds
   - Enable `chrome://flags/#enable-unsafe-webgpu` if needed

2. Check security headers in browser DevTools (Network tab)

3. Ensure GPU drivers are up to date

### Container Health Check Failing

```bash
# Check health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Manual health check
docker exec flonics-4dflow-visualization curl -f http://localhost/health
```

### Permission Issues

If you encounter permission errors:

```bash
# Fix file permissions
chmod -R 755 .

# Run deployment script with sudo (if needed)
sudo ./docker-deploy.sh
```

## Production Deployment

### Using Reverse Proxy (Nginx/Traefik)

Example nginx reverse proxy configuration:

```nginx
server {
    listen 80;
    server_name flonics.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebGPU headers
        add_header Cross-Origin-Embedder-Policy "require-corp" always;
        add_header Cross-Origin-Opener-Policy "same-origin" always;
    }
}
```

### SSL/TLS Configuration

For HTTPS deployment, use Let's Encrypt with certbot:

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d flonics.yourdomain.com
```

## Environment Variables

Available environment variables in docker-compose.yml:

- `NGINX_HOST`: Server hostname (default: localhost)
- `NGINX_PORT`: Internal port (default: 80)

## Performance Optimization

### Enable Caching

Already configured in nginx.conf:
- Static assets: 1 year cache
- HTML files: No cache (for updates)

### Compression

Gzip compression is enabled by default for:
- JavaScript (.js)
- CSS (.css)
- JSON (.json)
- HTML (.html)

## Monitoring and Logging

### Container Logs

```bash
# Stream logs
docker-compose logs -f

# Export logs to file
docker logs flonics-4dflow-visualization > app.log
```

### Health Monitoring

The container includes a health check endpoint at `/health`:

```bash
curl http://localhost:8080/health
```

## Cleanup

Remove all containers, images, and volumes:

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker rmi flonics-4dflow-viz

# Clean up unused resources
docker system prune -a
```

## Support

For issues or questions:

1. Check the main README.md
2. Review Docker logs
3. Verify WebGPU browser compatibility
4. Ensure GPU drivers are updated

## References

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)
- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
