FROM nginx:alpine

# Install required tools for setup
RUN apk add --no-cache bash

# Set working directory
WORKDIR /app

# Copy all files first
COPY . /app/

# Apply offline patches during build
RUN chmod +x /app/apply-offline-patches.sh && \
    cd /app && \
    ./apply-offline-patches.sh

# Copy patched files to nginx directory
RUN cp -r /app/* /usr/share/nginx/html/

# Copy offline nginx config
COPY nginx-offline.conf /etc/nginx/conf.d/default.conf

# Create error pages directory
RUN mkdir -p /usr/share/nginx/html/errors

# Copy error pages
COPY offline.html /usr/share/nginx/html/errors/
COPY blocked-api.html /usr/share/nginx/html/errors/

# Set proper permissions
RUN chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]