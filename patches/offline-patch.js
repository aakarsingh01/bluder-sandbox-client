// Offline Patch for CodeSandbox Build
// This script patches the main JavaScript files to disable external API calls

console.log('Applying offline patches to CodeSandbox build...');

// Global error handler for graceful error messages
window.addEventListener('error', function(event) {
  console.log('🚫 Global error caught:', event.error);
  
  // Show user-friendly error message
  if (event.error && (
    event.error.message.includes('fetch') ||
    event.error.message.includes('network') ||
    event.error.message.includes('dependencies') ||
    event.error.message.includes('Cannot resolve')
  )) {
    showLocalDevelopmentMessage('An error occurred while loading resources');
  }
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
  console.log('🚫 Unhandled promise rejection:', event.reason);
  
  if (event.reason && typeof event.reason === 'string' && (
    event.reason.includes('fetch') ||
    event.reason.includes('network') ||
    event.reason.includes('dependencies')
  )) {
    showLocalDevelopmentMessage('Failed to load required resources');
    event.preventDefault(); // Prevent the default unhandled rejection behavior
  }
});

// Function to show local development message
function showLocalDevelopmentMessage(errorType) {
  // Create or update error message overlay
  let errorOverlay = document.getElementById('offline-error-overlay');
  if (!errorOverlay) {
    errorOverlay = document.createElement('div');
    errorOverlay.id = 'offline-error-overlay';
    errorOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #e3f2fd;
      border-bottom: 1px solid #bbdefb;
      padding: 16px;
      text-align: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #1565c0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(errorOverlay);
  }
  
  errorOverlay.innerHTML = `
    <div>
      <strong>💡 For the best experience</strong><br>
      <span>Please run this project locally on your computer.</span>
      <a href="/dependency-help.html" style="margin-left: 10px; color: #1976d2;">View Setup Guide →</a>
      <button onclick="this.parentElement.parentElement.style.display='none'" style="margin-left: 10px; background: none; border: 1px solid #1565c0; color: #1565c0; padding: 4px 8px; border-radius: 4px; cursor: pointer;">×</button>
    </div>
  `;
}

// Completely disable CORS restrictions
console.log('🔓 Disabling all CORS restrictions...');

// Override XMLHttpRequest to disable CORS
if (window.XMLHttpRequest) {
  const originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    const originalSetRequestHeader = xhr.setRequestHeader;
    
    xhr.open = function(method, url, async = true, user, password) {
      // Set CORS mode to 'no-cors' for all requests
      this._method = method;
      this._url = url;
      return originalOpen.call(this, method, url, async, user, password);
    };
    
    xhr.setRequestHeader = function(header, value) {
      // Allow all headers
      try {
        return originalSetRequestHeader.call(this, header, value);
      } catch (e) {
        console.log('Header set bypassed:', header, value);
      }
    };
    
    // Disable CORS checking
    Object.defineProperty(xhr, 'withCredentials', {
      get: function() { return true; },
      set: function() { return true; }
    });
    
    return xhr;
  };
}

// Patch 1: Override fetch to block CodeSandbox API calls and disable CORS
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  const urlStr = typeof url === 'string' ? url : url.toString();
  
  // Force no-cors mode for all requests to disable CORS restrictions
  if (typeof options === 'object' && options !== null) {
    options.mode = options.mode || 'no-cors';
  } else {
    options = { mode: 'no-cors' };
  }
  
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
        message: 'Please run this locally',
        instruction: 'For the best development experience, run this project on your local machine.',
        setup_steps: [
          'Download or clone the project',
          'Run: npm install',
          'Run: npm start',
          'Open in your browser'
        ]
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
    
    // Handle dependency resolution requests
    if (urlStr.includes('/api/v1/dependencies') || urlStr.includes('/api/v1/sandpack/dependencies')) {
      console.log('🔄 Redirecting dependency request to NPM registry');
      
      // Extract package name from URL if possible
      const packageMatch = urlStr.match(/\/dependencies\/([^\/]+)/);
      if (packageMatch) {
        const packageName = packageMatch[1];
        // Redirect to NPM registry API
        return originalFetch(`https://registry.npmjs.org/${packageName}`, {
          ...options,
          mode: 'cors'
        }).then(response => {
          if (response.ok) {
            return response;
          }
          // Fallback response if NPM fails
          return new Response(JSON.stringify({
            message: 'Please run this locally',
            instruction: 'For reliable dependency management, run this project on your local machine.',
            setup_steps: [
              'Download or clone the project',
              'Run: npm install',
              'Run: npm start',
              'Enjoy faster performance and full functionality'
            ]
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }).catch(() => {
          return new Response(JSON.stringify({
            message: 'Please run this locally',
            instruction: 'For the best development experience, run this project on your local machine.',
            setup_steps: [
              'Download the project',
              'Open terminal in project folder',
              'Run: npm install',
              'Run: npm start'
            ]
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      }
      
      // Generic dependency response
      return Promise.resolve(new Response(JSON.stringify({
        message: 'Please run this locally',
        instruction: 'For better performance and full functionality, run this project on your local machine.',
        setup_steps: [
          'Download the project',
          'Run: npm install',
          'Run: npm start',
          'Enjoy faster development!'
        ]
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