#!/bin/bash

# Docker entrypoint script for CodeSandbox Offline
set -e

echo "🚀 Starting CodeSandbox Offline Mode..."
echo "📅 $(date)"
echo "🐳 Container: codesandbox-offline"
echo "🌐 Port: 80 (mapped to host:8080)"
echo ""

# Set environment variables
export IS_ONPREM=true
export OFFLINE_MODE=true
export USE_STATIC_PREVIEW=true

# Ensure patches directory exists and has correct permissions
mkdir -p /usr/share/nginx/html/patches
chmod 755 /usr/share/nginx/html/patches

# Ensure offline patches are in place
if [ ! -f "/usr/share/nginx/html/patches/offline-patch.js" ]; then
    echo "⚠️  Offline patches not found, copying from build..."
    cp /app/patches/* /usr/share/nginx/html/patches/ 2>/dev/null || true
fi

# Create workspace directory if it doesn't exist
mkdir -p /usr/share/nginx/html/workspace
chmod 755 /usr/share/nginx/html/workspace

# Validate nginx configuration
echo "🔧 Validating nginx configuration..."
nginx -t

# Print status information
echo "✅ CodeSandbox Offline Mode Ready!"
echo ""
echo "📋 Configuration:"
echo "   • Mode: Offline (API calls blocked)"
echo "   • NPM Registry: https://registry.npmjs.org/"
echo "   • File Storage: /workspace (if mounted)"
echo "   • Error Pages: Custom offline messages"
echo ""
echo "🌐 Available endpoints:"
echo "   • Main App: http://localhost:8080/"
echo "   • Health Check: http://localhost:8080/health"
echo "   • Config: http://localhost:8080/offline-config.json"
echo ""
echo "⚠️  Blocked domains:"
echo "   • *.codesandbox.io"
echo "   • *.csb.app / *.csb.dev"
echo "   • AWS CodeSandbox APIs"
echo "   • Analytics endpoints"
echo ""

# Start nginx in foreground
exec nginx -g "daemon off;"