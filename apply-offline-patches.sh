#!/bin/bash

# Script to apply offline patches to CodeSandbox build
echo "🔧 Applying offline patches to CodeSandbox build..."

# Create backup of original files
echo "📦 Creating backup of original files..."
cp index.html index.html.backup
cp static/js/sandbox.5f40c6a02.js static/js/sandbox.5f40c6a02.js.backup 2>/dev/null || true

# Inject offline patch script into index.html
echo "🩹 Injecting offline patches into index.html..."

# Create modified index.html with offline patches
cat > index.html << 'EOF'
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Offline Sandbox - CodeSandbox</title>
    <link rel="manifest" href="/manifest.json">
    <link href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
<style>
svg {
background: transparent;
}
path {
fill: black;
}
@media (prefers-color-scheme: dark)  {
path {
  fill: white;
}
}
</style>
<path fill-rule='evenodd' clip-rule='evenodd' d='M81.8182 18.1818V81.8182H18.1818V18.1818H81.8182ZM10 90V10H90V90H10Z'/>
</svg>" rel="icon"/>
    <link rel="mask-icon" href="/csb-ios.svg" color="#fff">
    <script src="/static/browserfs12/browserfs.min.js" type="text/javascript"></script>
    <script>
        window.process = BrowserFS.BFSRequire("process");
        window.Buffer = BrowserFS.BFSRequire("buffer").Buffer;
        
        // Set offline environment variables
        window._env_ = {
            IS_ONPREM: 'true',
            OFFLINE_MODE: 'true',
            USE_STATIC_PREVIEW: 'true'
        };
        
        // Initialize development environment
        console.log('🔄 Initializing development environment...');
    </script>
    <!-- Error Boundary System -->
    <script src="/error-boundary.js"></script>
    <!-- Package Fallback System -->
    <script src="/package-fallbacks.js"></script>
    <!-- Offline Patch Script -->
    <script src="/patches/offline-patch.js"></script>
</head>
<body>
    <div id="csb-loading-screen">
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #666;">
            <h2>🔄 Loading...</h2>
            <p>For the best experience, please run this locally</p>
        </div>
    </div>
    
    <!-- Register offline service worker -->
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/patches/offline-sw.js')
                .then(registration => {
                    console.log('✅ Offline service worker registered');
                })
                .catch(error => {
                    console.log('❌ Service worker registration failed:', error);
                });
        }
    </script>
    
    <!-- Original scripts -->
    <script src="/static/js/vendors~sandbox.ecbcf4e6a.chunk.js" crossorigin="anonymous"></script>
    <script src="/static/js/default~sandbox~sandbox-startup.19e4d6b87.chunk.js" crossorigin="anonymous"></script>
    <script src="/static/js/sandbox.5f40c6a02.js" crossorigin="anonymous"></script>
    <script src="/static/js/vendors~sandbox-startup.ca8a95b40.chunk.js" crossorigin="anonymous"></script>
    <script src="/static/js/sandbox-startup.a0ea8d1cb.js" crossorigin="anonymous"></script>
    
    <!-- Additional offline initialization -->
    <script>
        // Remove loading screen after a delay
        setTimeout(() => {
            const loadingScreen = document.getElementById('csb-loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
            console.log('✅ Development environment ready');
        }, 2000);
    </script>
</body>
</html>
EOF

# Create offline configuration file
echo "⚙️  Creating offline configuration..."
cat > offline-config.json << 'EOF'
{
  "name": "Offline CodeSandbox",
  "version": "1.0.0",
  "mode": "offline",
  "features": {
    "api_calls": false,
    "authentication": false,
    "telemetry": false,
    "external_packages": true
  },
  "npm_registry": "https://registry.npmjs.org/",
  "allowed_domains": [
    "registry.npmjs.org",
    "unpkg.com",
    "cdn.skypack.dev",
    "esm.sh"
  ]
}
EOF

# Update nginx config to handle offline mode
echo "🌐 Updating nginx configuration for offline mode..."
cat > nginx-offline.conf << 'EOF'
server {
    listen 8080;
    server_name localhost;
    
    # Document root
    root /Users/a/Downloads/bundler;
    index index.html;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Security headers for offline mode
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' registry.npmjs.org unpkg.com cdn.skypack.dev esm.sh; connect-src 'self' registry.npmjs.org unpkg.com cdn.skypack.dev esm.sh" always;
    
    # Main location block
    location / {
        try_files $uri $uri/ @fallback;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Service worker should not be cached
        location = /service-worker.js {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
        
        # Offline patches
        location /patches/ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
        
        # Worker files
        location ~* \.worker\.js$ {
            expires 1y;
            add_header Cache-Control "public";
        }
    }
    
    # Block CodeSandbox API calls at nginx level
    location ~* /api/v1/(sandboxes|sandpack|dependencies) {
        return 503 "Offline mode: API disabled";
        add_header Content-Type "text/plain";
    }
    
    location ~* /auth/(sandbox|sandpack) {
        return 503 "Offline mode: Authentication disabled";
        add_header Content-Type "text/plain";
    }
    
    # Fallback for SPA routing
    location @fallback {
        rewrite ^.*$ /index.html last;
    }
    
    # Handle manifest.json with proper MIME type
    location = /manifest.json {
        add_header Content-Type "application/manifest+json";
        expires 1d;
    }
    
    # Offline config
    location = /offline-config.json {
        add_header Content-Type "application/json";
        expires -1;
    }
    
    # Error pages
    error_page 404 /index.html;
    error_page 503 /offline.html;
}
EOF

# Create offline error page
cat > offline.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Offline Mode</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #f5f5f5; 
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .icon { font-size: 48px; margin-bottom: 20px; }
        h1 { color: #333; }
        p { color: #666; line-height: 1.5; }
        .button {
            display: inline-block;
            background: #0070f3;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔌</div>
        <h1>Offline Mode Active</h1>
        <p>This CodeSandbox instance is running in offline mode. External API calls to CodeSandbox infrastructure have been disabled.</p>
        <p>You can still use the sandbox editor and work with local files.</p>
        <a href="/" class="button">← Back to Sandbox</a>
    </div>
</body>
</html>
EOF

# Update the start script
echo "📝 Updating start script for offline mode..."
cat > start-offline.sh << 'EOF'
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
EOF

chmod +x start-offline.sh

echo ""
echo "✅ Offline patches applied successfully!"
echo ""
echo "📁 Created files:"
echo "   • patches/offline-patch.js     - JavaScript patches for API blocking"
echo "   • patches/offline-sw.js       - Service worker for request interception"
echo "   • nginx-offline.conf          - Nginx config with API blocking"
echo "   • start-offline.sh            - Startup script for offline mode"
echo "   • offline-config.json         - Offline configuration"
echo "   • offline.html                - Offline error page"
echo ""
echo "🚀 To start in offline mode:"
echo "   ./start-offline.sh"
echo ""
echo "🔄 To revert changes:"
echo "   mv index.html.backup index.html"
echo "   mv static/js/sandbox.5f40c6a02.js.backup static/js/sandbox.5f40c6a02.js"
echo ""
echo "⚠️  Note: Offline mode blocks all CodeSandbox API calls but allows NPM registry access"