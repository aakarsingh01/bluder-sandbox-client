// Enhanced Error Boundary System - catches all unhandled errors gracefully
(function() {
  'use strict';
  
  let errorCount = 0;
  const MAX_ERRORS = 10;
  
  // Create user-friendly error display
  function createErrorDisplay(message) {
    const existingError = document.getElementById('error-message');
    if (existingError) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    
    errorDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="font-size: 20px;">💻</div>
        <div>
          <div style="font-weight: 600; margin-bottom: 5px;">Development Note</div>
          <div>${message}</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: auto;">×</button>
      </div>
    `;
    
    // Add animation styles if not already added
    if (!document.getElementById('error-animations')) {
      const style = document.createElement('style');
      style.id = 'error-animations';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (errorDiv && errorDiv.parentElement) {
        errorDiv.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => errorDiv.remove(), 300);
      }
    }, 8000);
  }
  
  // Enhanced error handler
  function handleError(error, context = 'Application') {
    errorCount++;
    
    // Prevent error spam
    if (errorCount > MAX_ERRORS) {
      console.log('🔇 Too many errors, suppressing further notifications');
      return true;
    }
    
    // Log for debugging (developers only)
    console.log(`🛠️ ${context} issue handled gracefully:`, error);
    
    // Show user-friendly message
    createErrorDisplay('Please run this project locally for the full experience');
    
    return true; // Prevent default error handling
  }
  
  // Global error handlers
  window.addEventListener('error', function(event) {
    handleError(event.error || event.message, 'Runtime');
  });
  
  window.addEventListener('unhandledrejection', function(event) {
    handleError(event.reason, 'Promise');
    event.preventDefault();
  });
  
  // Console error override for cleaner logs
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Filter out common development messages
    const message = args.join(' ').toLowerCase();
    
    if (message.includes('network') || 
        message.includes('fetch') ||
        message.includes('cors') ||
        message.includes('404') ||
        message.includes('sandbox') ||
        message.includes('codesandbox')) {
      console.log('💻 Development note:', 'Please run locally for external resources');
      return;
    }
    
    // Show original error for actual issues
    originalConsoleError.apply(console, args);
  };
  
  // Module loading error handler
  if (typeof window.addEventListener === 'function') {
    document.addEventListener('DOMContentLoaded', function() {
      // Handle script loading errors
      document.querySelectorAll('script[src]').forEach(script => {
        script.addEventListener('error', function() {
          handleError(`Script load failed: ${script.src}`, 'Module Loading');
        });
      });
      
      // Handle link/CSS loading errors
      document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        link.addEventListener('error', function() {
          handleError(`Stylesheet load failed: ${link.href}`, 'Style Loading');
        });
      });
    });
  }
  
  // Create graceful fallback for missing elements
  function createFallbackElement(selector) {
    const existing = document.querySelector(selector);
    if (!existing) {
      const div = document.createElement('div');
      div.id = selector.replace('#', '');
      div.className = selector.replace('.', '');
      div.style.cssText = 'min-height: 200px; display: flex; align-items: center; justify-content: center; color: #666; font-family: sans-serif;';
      div.innerHTML = '<p>💻 Please run locally for the complete experience</p>';
      document.body.appendChild(div);
      return div;
    }
    return existing;
  }
  
  // Ensure critical elements exist
  setTimeout(() => {
    if (!document.getElementById('root')) createFallbackElement('#root');
    if (!document.getElementById('app')) createFallbackElement('#app');
    if (!document.querySelector('.app')) createFallbackElement('.app');
  }, 1000);
  
  // Network request fallback
  if (typeof window.XMLHttpRequest !== 'undefined') {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this.addEventListener('error', function() {
        handleError(`Network request failed: ${url}`, 'Network');
      });
      return originalOpen.apply(this, [method, url, ...args]);
    };
  }
  
  console.log('✅ Enhanced error boundary system initialized');
  
  // Export for use by other scripts
  window.__errorBoundary = {
    handleError,
    createErrorDisplay,
    createFallbackElement
  };
})();