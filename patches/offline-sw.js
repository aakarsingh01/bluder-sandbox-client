// Offline Service Worker for CodeSandbox
// Intercepts and blocks external API calls, allows all CORS

const CACHE_NAME = 'offline-codesandbox-v1';

// Headers to make all responses CORS-permissive
const getCORSHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
});

// URLs to block (CodeSandbox infrastructure)
const BLOCKED_PATTERNS = [
  /codesandbox\.io\/api\//,
  /csb\.app\/api\//,
  /csb\.dev\/api\//,
  /auth\/sandbox/,
  /auth\/sandpack/,
  /col\.csbops\.io/,
  /execute-api\.eu-west-1\.amazonaws\.com/,
  /prod-packager-packages\.codesandbox\.io/,
  /codesandbox\.io\/p\//,
  /new\.codesandbox\.io/
];

// Mock responses for blocked requests with user-friendly messages
const getMockResponse = (url) => {
  if (url.includes('/api/v1/sandboxes/') && !url.includes('/cache')) {
    return new Response(JSON.stringify({
      error: 'Cannot render the page',
      message: 'This CodeSandbox instance is running in offline mode. Please download and run the sandbox locally.',
      suggestion: 'For full functionality, download the project files and run them in your local development environment.',
      local_setup: [
        'Download project files',
        'Open in VS Code or your preferred editor', 
        'Run `npm install` to install dependencies',
        'Use `npm start` or local development server'
      ],
      status: 'offline_mode'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
    });
  }
  
  if (url.includes('/cache')) {
    return new Response(JSON.stringify({ 
      error: 'Cloud save unavailable',
      message: 'Cannot save to CodeSandbox cloud in offline mode. Please save your work locally.',
      success: false,
      offline: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
    });
  }
  
  if (url.includes('/api/v1/sandpack/registry')) {
    return new Response(JSON.stringify({
      error: 'Private registry unavailable',
      message: 'CodeSandbox private npm registry is not available offline. Falling back to public npm registry.',
      fallback_registry: 'https://registry.npmjs.org/',
      auth_type: 'none',
      enabled_scopes: [],
      limit_to_scopes: false,
      proxy_enabled: false,
      registry_auth_key: '',
      registry_type: 'npm',
      registry_url: 'https://registry.npmjs.org/'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
    });
  }
  
  // Default blocked response with download suggestion
  return new Response(JSON.stringify({
    error: 'Cannot render the page',
    message: 'This feature is not available in offline mode.',
    suggestion: 'Please download and run locally for full CodeSandbox functionality.',
    blocked_url: url,
    instructions: [
      '1. Download your project files',
      '2. Set up a local development environment',
      '3. Use tools like VS Code, npm, or yarn',
      '4. Run a local development server'
    ],
    offline_mode: true
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json', ...getCORSHeaders() }
  });
};

// Service Worker event listeners
self.addEventListener('install', (event) => {
  console.log('Offline service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Offline service worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Check if request should be blocked
  const shouldBlock = BLOCKED_PATTERNS.some(pattern => pattern.test(url));
  
  if (shouldBlock) {
    console.log('🚫 Blocked request to:', url);
    event.respondWith(getMockResponse(url));
    return;
  }
  
  // Allow npm registry and other legitimate requests with CORS headers
  if (url.includes('registry.npmjs.org') || 
      url.includes('unpkg.com') || 
      url.includes('cdn.skypack.dev') ||
      url.includes('esm.sh')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to add CORS headers
          const newHeaders = new Headers(response.headers);
          Object.entries(getCORSHeaders()).forEach(([key, value]) => {
            newHeaders.set(key, value);
          });
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          });
        })
        .catch(() => fetch(event.request))
    );
    return;
  }
  
  // For local requests, try cache first, then network (with CORS headers)
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        // Add CORS headers to cached responses
        const newHeaders = new Headers(response.headers);
        Object.entries(getCORSHeaders()).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }
      
      return fetch(event.request)
        .then(networkResponse => {
          // Add CORS headers to network responses
          const newHeaders = new Headers(networkResponse.headers);
          Object.entries(getCORSHeaders()).forEach(([key, value]) => {
            newHeaders.set(key, value);
          });
          
          return new Response(networkResponse.body, {
            status: networkResponse.status,
            statusText: networkResponse.statusText,
            headers: newHeaders
          });
        })
        .catch(() => {
        // Return a generic offline response for failed requests
        return new Response('Offline', { status: 503 });
      });
    })
  );
});