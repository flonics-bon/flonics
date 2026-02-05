# 4D Flow MRI Visualization - Docker Configuration
FROM nginx:alpine

# Install necessary packages
RUN apk add --no-cache \
    curl \
    bash

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy application files
COPY index.html .
COPY flowVisualization.js .
COPY README.md .

# Create custom nginx configuration for WebGPU headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
