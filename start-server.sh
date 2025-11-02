#!/bin/bash

# CodeSandbox nginx server startup script

echo "Starting nginx server for CodeSandbox..."

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

# Start nginx with custom config
echo "Starting nginx on http://localhost:8080"
echo "Document root: $DIR"
echo ""
echo "To stop the server, press Ctrl+C or run: nginx -s stop"
echo ""

# Run nginx in foreground mode with custom config
nginx -p "$DIR" -c "$DIR/nginx.conf" -g "daemon off;"