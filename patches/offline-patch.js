// Offline Patch for CodeSandbox Build
// This script patches the main JavaScript files to disable external API calls

console.log('Applying offline patches to CodeSandbox build...');

// Patch 1: Override fetch to block CodeSandbox API calls
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  const urlStr = typeof url === 'string' ? url : url.toString();
  
  // Block CodeSandbox API calls
  if (urlStr.includes('codesandbox.io/api/') ||
      urlStr.includes('csb.app/api/') ||
      urlStr.includes('csb.dev/api/') ||
      urlStr.includes('/api/v1/sandboxes') ||
      urlStr.includes('/api/v1/sandpack') ||
      urlStr.includes('/auth/sandbox') ||
      urlStr.includes('/auth/sandpack') ||
      urlStr.includes('col.csbops.io') ||
      urlStr.includes('execute-api.eu-west-1.amazonaws.com') ||
      urlStr.includes('prod-packager-packages.codesandbox.io')) {
    
    console.log('🚫 Blocked CodeSandbox API call to:', urlStr);
    
    // Return user-friendly responses for blocked endpoints
    if (urlStr.includes('/api/v1/sandboxes/') && !urlStr.includes('/cache')) {
      return Promise.resolve(new Response(JSON.stringify({
        error: 'Cannot render the page',
        message: 'This CodeSandbox instance is running in offline mode. Please download and run the sandbox locally.',
        suggestion: 'Download the project files and run them in your local development environment.',
        local_alternatives: [
          'Use VS Code with Live Server extension',
          'Run with Node.js and npm/yarn',
          'Use local development servers like Vite, Webpack, or Parcel'
        ],
        status: 'offline'
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    if (urlStr.includes('/cache')) {
      return Promise.resolve(new Response(JSON.stringify({ 
        error: 'Cannot save to cloud',
        message: 'Cloud save is disabled in offline mode. Please save files locally.',
        success: false 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    if (urlStr.includes('/api/v1/sandpack/registry')) {
      return Promise.resolve(new Response(JSON.stringify({
        error: 'Private registry unavailable',
        message: 'CodeSandbox private registry is not available in offline mode. Using public NPM registry.',
        fallback: 'https://registry.npmjs.org/',
        auth_type: 'none',
        enabled_scopes: [],
        limit_to_scopes: false,
        proxy_enabled: false,
        registry_auth_key: '',
        registry_type: 'npm',
        registry_url: 'https://registry.npmjs.org/'
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    // Default blocked response with helpful message
    return Promise.resolve(new Response(JSON.stringify({
      error: 'Cannot render the page',
      message: 'This feature requires CodeSandbox cloud services which are disabled in offline mode.',
      suggestion: 'Please download and run locally for full functionality.',
      blocked_url: urlStr,
      alternatives: [
        'Download project as ZIP file',
        'Clone repository locally',
        'Use local development tools'
      ]
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
  
  // Allow other fetch calls (like npm registry)
  return originalFetch(url, options);
};

// Patch 2: Disable authentication flows
window.requestSandpackSecretFromApp = function() {
  console.log('🚫 Blocked sandpack authentication request');
  return Promise.resolve(null);
};

window.requestPreviewSecretFromApp = function() {
  console.log('🚫 Blocked preview secret request');
  return Promise.resolve(null);
};

// Patch 3: Mock sandbox data loading
if (typeof window.loadSandboxFromAPI !== 'undefined') {
  window.loadSandboxFromAPI = function() {
    console.log('🚫 Blocked sandbox API loading, using local mode');
    return Promise.resolve({
      modules: {},
      directories: [],
      npmDependencies: {},
      template: 'vanilla'
    });
  };
}

// Patch 4: Override postMessage to parent (for embedded mode)
const originalPostMessage = window.postMessage;
window.postMessage = function(message, targetOrigin) {
  if (message && typeof message === 'object' && message.codesandbox) {
    console.log('🚫 Blocked CodeSandbox postMessage:', message.type);
    return;
  }
  return originalPostMessage.call(this, message, targetOrigin);
};

// Patch 5: Disable service worker updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    registrations.forEach(function(registration) {
      if (registration.scope.includes('codesandbox')) {
        console.log('🚫 Unregistering CodeSandbox service worker');
        registration.unregister();
      }
    });
  });
}

// Patch 6: Mock environment for offline mode
window._env_ = window._env_ || {};
window._env_.IS_ONPREM = 'true';
window._env_.OFFLINE_MODE = 'true';

// Patch 7: Override WebSocket connections
const OriginalWebSocket = window.WebSocket;
window.WebSocket = function(url, protocols) {
  if (typeof url === 'string' && (
    url.includes('codesandbox.io') || 
    url.includes('csb.app') || 
    url.includes('csb.dev')
  )) {
    console.log('🚫 Blocked WebSocket connection to:', url);
    // Return a mock WebSocket that does nothing
    return {
      close: () => {},
      send: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      readyState: WebSocket.CLOSED
    };
  }
  return new OriginalWebSocket(url, protocols);
};

// Copy static properties
Object.getOwnPropertyNames(OriginalWebSocket).forEach(name => {
  if (name !== 'length' && name !== 'name' && name !== 'prototype') {
    window.WebSocket[name] = OriginalWebSocket[name];
  }
});

console.log('✅ Offline patches applied successfully');
console.log('🔄 CodeSandbox will now run in offline mode');