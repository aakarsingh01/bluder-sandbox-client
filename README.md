# CodeSandbox Offline Mode 🚀

A fully containerized, offline version of CodeSandbox that runs completely on your local infrastructure without connecting to CodeSandbox services.

## Features ✨

- **🔒 Completely Offline**: No external CodeSandbox API calls
- **🐳 Docker Ready**: Plug-and-play Docker setup
- **📦 NPM Access**: Still allows NPM package installation
- **🛡️ Secure**: Blocks analytics, telemetry, and external services
- **🎯 User Friendly**: Custom error messages instead of failures
- **⚡ Fast**: No network latency for blocked services

## Quick Start 🏃‍♂️

### Option 1: Docker Compose (Recommended)

```bash
# Clone or download the CodeSandbox bundle to this directory
# Then simply run:
docker-compose up

# Or run in background:
docker-compose up -d
```

### Option 2: Manual Docker

```bash
# Build the image
docker build -t codesandbox-offline .

# Run the container
docker run -p 8080:80 codesandbox-offline
```

## Access Your CodeSandbox 🌐

Once running, access your offline CodeSandbox at:

- **Main Application**: http://localhost:8080/
- **Health Check**: http://localhost:8080/health
- **Configuration**: http://localhost:8080/offline-config.json

## What's Blocked 🚫

The following external services are blocked and return friendly error messages:

- `*.codesandbox.io` - Main CodeSandbox APIs
- `*.csb.app` / `*.csb.dev` - CodeSandbox app domains
- AWS CodeSandbox services
- Analytics and telemetry endpoints
- Authentication services

## What Still Works ✅

- **NPM Registry**: `registry.npmjs.org`
- **CDN Services**: `unpkg.com`, `cdn.skypack.dev`, `esm.sh`
- **Local Development**: Full offline sandbox functionality
- **File Operations**: Create, edit, save files locally
- **Package Installation**: Install packages from NPM

## Architecture 🏗️

The offline mode uses a three-layer blocking approach:

1. **JavaScript Patches**: Runtime patches that override `fetch()` and `WebSocket` APIs
2. **Service Worker**: Browser-level request interception
3. **Nginx Proxy**: Server-level blocking with custom error pages

## Directory Structure 📁

```
/
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile            # Container definition
├── nginx-offline.conf    # Nginx configuration with API blocking
├── patches/             # Offline modification scripts
│   ├── offline-patch.js  # JavaScript API patches
│   └── offline-sw.js    # Service worker for request interception
├── apply-offline-patches.sh  # Build script to apply patches
├── docker-entrypoint.sh      # Container startup script
├── offline.html              # Offline mode info page
├── blocked-api.html          # API blocked error page
└── [CodeSandbox files]      # Original CodeSandbox build files
```

## Environment Variables 🔧

The container sets these environment variables for offline mode:

- `IS_ONPREM=true` - Indicates on-premises deployment
- `OFFLINE_MODE=true` - Enables offline mode features
- `USE_STATIC_PREVIEW=true` - Uses static preview mode

## Health Monitoring 📊

The container includes:

- **Health Check**: Automatic health monitoring every 30 seconds
- **Status Logging**: Detailed startup information
- **Configuration Validation**: Nginx config validation on startup

## Troubleshooting 🔧

### Container won't start
```bash
docker logs codesandbox-offline
```

### Check if ports are available
```bash
netstat -an | grep 8080
```

### Test specific endpoints
```bash
# Test main app
curl -I http://localhost:8080/

# Test health check
curl http://localhost:8080/health

# Test API blocking
curl http://localhost:8080/api/v1/sandboxes
```

### Reset everything
```bash
docker-compose down
docker-compose up --build
```

## Customization 🎨

### Change Port
Edit `docker-compose.yml`:
```yaml
ports:
  - "3000:80"  # Changes to port 3000
```

### Mount Local Workspace
Add volume to `docker-compose.yml`:
```yaml
volumes:
  - ./workspace:/workspace
```

### Modify Blocked Domains
Edit `nginx-offline.conf` and add/remove blocked patterns.

## Performance 🚀

- **Cold Start**: ~3-5 seconds
- **Memory Usage**: ~50-100MB
- **Network**: No external calls except to NPM registry
- **Storage**: Lightweight Alpine Linux base

## Security 🔒

- No data leaves your network
- All CodeSandbox analytics disabled
- No authentication tokens transmitted
- All external tracking blocked

## Development 👨‍💻

To modify the offline patches:

1. Edit `patches/offline-patch.js` for JavaScript modifications
2. Edit `patches/offline-sw.js` for service worker changes
3. Run `./apply-offline-patches.sh` to apply changes
4. Rebuild with `docker-compose up --build`

## Support 💬

This is a custom offline deployment. For issues:

1. Check container logs: `docker logs codesandbox-offline`
2. Verify nginx config: `docker exec codesandbox-offline nginx -t`
3. Test endpoints manually with curl
4. Check Docker port bindings: `docker ps`

## License 📜

This offline configuration maintains the same license as the original CodeSandbox build files.