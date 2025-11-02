# Offline CodeSandbox

This is a modified version of the CodeSandbox build that runs completely offline, without connecting to CodeSandbox infrastructure.

## 🚀 Quick Start

### Using the Offline Mode

```bash
# Apply offline patches (already done)
./apply-offline-patches.sh

# Start the offline server
./start-offline.sh
```

Then open http://localhost:8080 in your browser.

### Using Docker

```bash
# Build the Docker image
docker build -t codesandbox-offline .

# Run the container
docker run -p 8080:80 codesandbox-offline
```

## 🔌 What's Blocked in Offline Mode

The offline patches prevent connections to:

### CodeSandbox APIs
- ❌ `/api/v1/sandboxes/*` - Sandbox data and management
- ❌ `/api/v1/sandpack/*` - Package registry and authentication
- ❌ `/api/v1/dependencies` - Dependency resolution
- ❌ `/auth/sandbox/*` - Sandbox authentication
- ❌ `/auth/sandpack/*` - Sandpack authentication

### External Services
- ❌ `col.csbops.io` - Analytics and telemetry
- ❌ `*.execute-api.eu-west-1.amazonaws.com` - AWS package APIs
- ❌ `prod-packager-packages.codesandbox.io` - CodeSandbox package CDN
- ❌ `*.codesandbox.io` - All CodeSandbox domains
- ❌ `*.csb.app` and `*.csb.dev` - CodeSandbox preview domains

### What Still Works
- ✅ `registry.npmjs.org` - NPM package registry
- ✅ `unpkg.com` - NPM package CDN
- ✅ `cdn.skypack.dev` - Modern package CDN
- ✅ `esm.sh` - ES module CDN

## 🛠️ Technical Implementation

### 1. JavaScript Patches (`patches/offline-patch.js`)
- Overrides `window.fetch()` to block CodeSandbox API calls
- Provides mock responses for essential APIs
- Disables authentication flows
- Sets offline environment variables

### 2. Service Worker (`patches/offline-sw.js`)
- Intercepts network requests at the browser level
- Blocks CodeSandbox infrastructure calls
- Allows legitimate package registry requests
- Provides offline fallbacks

### 3. Nginx Configuration (`nginx-offline.conf`)
- Server-level blocking of API endpoints
- Content Security Policy to restrict connections
- Proper caching headers for offline operation
- Custom error pages for blocked requests

### 4. Modified HTML (`index.html`)
- Includes offline patches before main scripts
- Sets offline environment variables
- Registers offline service worker
- Custom loading screen with offline status

## 📋 Features Available in Offline Mode

### ✅ Working Features
- **File Editor**: Full-featured code editor with syntax highlighting
- **JavaScript Execution**: Run JavaScript code in the browser
- **Preview**: Live preview of web applications
- **NPM Packages**: Install packages from npmjs.org and CDNs
- **Local Development**: Complete local development environment
- **File Management**: Create, edit, and organize files
- **Multiple Languages**: Support for JS, TS, CSS, HTML, etc.

### ❌ Disabled Features
- **Cloud Sync**: No saving to CodeSandbox cloud
- **Authentication**: No user accounts or login
- **Collaboration**: No real-time collaboration features
- **Templates**: Limited to basic templates
- **Analytics**: No usage tracking or telemetry
- **Premium Features**: Terminal upgrades, etc.

## 🔧 Configuration

### Environment Variables
Set in `window._env_` or `.env`:

```javascript
IS_ONPREM=true          // Enable on-premise mode
OFFLINE_MODE=true       // Enable offline mode  
USE_STATIC_PREVIEW=true // Use static previews
PREVIEW_DOMAIN=localhost // Local preview domain
```

### Offline Config (`offline-config.json`)
```json
{
  "name": "Offline CodeSandbox",
  "mode": "offline",
  "npm_registry": "https://registry.npmjs.org/",
  "allowed_domains": [
    "registry.npmjs.org",
    "unpkg.com", 
    "cdn.skypack.dev",
    "esm.sh"
  ]
}
```

## 🔄 Reverting to Online Mode

To restore the original CodeSandbox functionality:

```bash
# Restore original files
mv index.html.backup index.html
mv static/js/sandbox.5f40c6a02.js.backup static/js/sandbox.5f40c6a02.js

# Use original nginx config
nginx -p . -c ./nginx.conf -g "daemon off;"
```

## 🐳 Docker Support

The Docker setup automatically uses the offline configuration:

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
COPY nginx-offline.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🚨 Troubleshooting

### Common Issues

1. **Blank screen on load**
   - Check browser console for blocked requests
   - Ensure offline patches are loaded
   - Try clearing browser cache

2. **Service worker errors**
   - Check if HTTPS is required (use localhost)
   - Verify service worker registration
   - Check for conflicting service workers

3. **Package installation fails**
   - Verify NPM registry access
   - Check network connectivity to allowed domains
   - Try different package CDNs

### Debug Mode

Enable debug logging:
```javascript
localStorage.setItem('debug', 'true');
```

## 📁 File Structure

```
├── patches/
│   ├── offline-patch.js     # Main JavaScript patches
│   └── offline-sw.js        # Service worker for request blocking
├── nginx-offline.conf       # Nginx configuration for offline mode
├── start-offline.sh         # Startup script for offline mode
├── offline-config.json      # Offline configuration
├── offline.html            # Offline error page
├── index.html              # Modified main HTML file
└── apply-offline-patches.sh # Script to apply all patches
```

## 🤝 Contributing

To add new blocked domains or modify offline behavior:

1. Edit `patches/offline-patch.js` for JavaScript-level blocking
2. Update `patches/offline-sw.js` for service worker blocking  
3. Modify `nginx-offline.conf` for server-level blocking
4. Test thoroughly in offline environment

## 📄 License

This is a modified version of the CodeSandbox build. Please respect the original CodeSandbox terms and licenses when using this offline version.

---

**Note**: This offline mode is designed for development and testing purposes. For production use, consider the implications of running without CodeSandbox's cloud features and support.