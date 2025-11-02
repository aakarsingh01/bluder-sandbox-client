#!/bin/bash

# Offline CodeSandbox startup script

echo "🚀 Starting Offline CodeSandbox..."

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "Error: nginx is not installed."
    echo "Please install nginx first:"
    echo "  macOS: brew install nginx"
    echo "  Ubuntu/Debian: sudo apt-get install nginx"
    echo "  CentOS/RHEL: sudo yum install nginx"
    exit 1
fi

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Start nginx with offline config
echo "🌐 Starting nginx with offline configuration"
echo "📍 Document root: $DIR"
echo "🔗 Server URL: http://localhost:8080"
echo "🔌 Mode: Offline (CodeSandbox API disabled)"
echo ""
echo "✅ Features available in offline mode:"
echo "   • File editor and syntax highlighting"
echo "   • JavaScript execution and preview"
echo "   • NPM package installation (from npmjs.org)"
echo "   • Local development server"
echo ""
echo "❌ Features disabled in offline mode:"
echo "   • CodeSandbox authentication"
echo "   • Cloud saves and syncing"
echo "   • Collaborative features"
echo "   • Analytics and telemetry"
echo ""
echo "To stop the server, press Ctrl+C"
echo ""

# Run nginx in foreground mode with offline config
nginx -p "$DIR" -c "$DIR/nginx-offline.conf" -g "daemon off;"
