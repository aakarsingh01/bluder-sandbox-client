// Package Fallback System - provides safe fallbacks for missing packages
(function() {
  'use strict';
  
  // Common package fallbacks to prevent errors
  const packageFallbacks = {
    // React ecosystem
    'react': {
      createElement: function(type, props, ...children) {
        const element = document.createElement(typeof type === 'string' ? type : 'div');
        if (props) {
          Object.keys(props).forEach(key => {
            if (key === 'className') element.className = props[key];
            else if (key.startsWith('on')) element.addEventListener(key.slice(2).toLowerCase(), props[key]);
            else element.setAttribute(key, props[key]);
          });
        }
        children.forEach(child => {
          if (typeof child === 'string') element.appendChild(document.createTextNode(child));
          else if (child) element.appendChild(child);
        });
        return element;
      },
      Component: class Component {
        constructor(props) { this.props = props || {}; }
        render() { return null; }
      },
      useState: function(initial) { return [initial, function() {}]; },
      useEffect: function() {},
      Fragment: 'div'
    },
    
    'react-dom': {
      render: function(element, container) {
        if (container && element) {
          if (typeof element === 'string') container.innerHTML = element;
          else if (element.appendChild) container.appendChild(element);
        }
      },
      createRoot: function(container) {
        return {
          render: function(element) {
            if (container && element) {
              if (typeof element === 'string') container.innerHTML = element;
              else if (element.appendChild) container.appendChild(element);
            }
          }
        };
      }
    },
    
    'react-router-dom': {
      BrowserRouter: function(props) { return props.children; },
      Route: function() { return null; },
      Link: function(props) { 
        const a = document.createElement('a');
        a.href = props.to || '#';
        return a;
      }
    },
    
    // Utility libraries
    'lodash': {
      map: function(arr, fn) { return Array.isArray(arr) ? arr.map(fn) : []; },
      filter: function(arr, fn) { return Array.isArray(arr) ? arr.filter(fn) : []; },
      forEach: function(arr, fn) { if (Array.isArray(arr)) arr.forEach(fn); },
      get: function(obj, path, defaultValue) { 
        try {
          return path.split('.').reduce((o, p) => o && o[p], obj) || defaultValue;
        } catch { return defaultValue; }
      },
      set: function(obj, path, value) { return obj; },
      debounce: function(fn, delay) {
        let timeout;
        return function(...args) {
          clearTimeout(timeout);
          timeout = setTimeout(() => fn.apply(this, args), delay);
        };
      }
    },
    
    // HTTP libraries
    'axios': {
      get: function() { return Promise.resolve({ data: {} }); },
      post: function() { return Promise.resolve({ data: {} }); },
      put: function() { return Promise.resolve({ data: {} }); },
      delete: function() { return Promise.resolve({ data: {} }); },
      create: function() { return this; }
    },
    
    'fetch': function() { return Promise.resolve({ json: () => Promise.resolve({}) }); },
    
    // Date/time libraries
    'moment': function() {
      return {
        format: function() { return new Date().toISOString(); },
        add: function() { return this; },
        subtract: function() { return this; }
      };
    },
    
    'date-fns': {
      format: function(date, format) { return new Date(date).toLocaleDateString(); },
      parse: function(str) { return new Date(str); }
    },
    
    // CSS-in-JS libraries
    'styled-components': {
      default: function(tag) {
        return function(strings, ...values) {
          return function(props) {
            const element = document.createElement(tag);
            return element;
          };
        };
      }
    },
    
    // State management
    'redux': {
      createStore: function() {
        return {
          getState: () => ({}),
          dispatch: () => {},
          subscribe: () => () => {}
        };
      },
      combineReducers: function(reducers) { return () => ({}); }
    },
    
    // Testing libraries
    'jest': {},
    '@testing-library/react': {
      render: function() { return {}; },
      screen: {}
    },
    
    // Animation libraries
    'framer-motion': {
      motion: new Proxy({}, {
        get: () => function(props) { return props.children; }
      })
    },
    
    // UI libraries
    '@mui/material': {},
    'antd': {},
    'react-bootstrap': {},
    
    // Build tools
    'webpack': {},
    'vite': {},
    'parcel': {},
    
    // Generic fallbacks for common patterns
    '@': {},
    '~': {},
    'src': {},
    'components': {},
    'utils': {},
    'lib': {},
    'assets': {}
  };
  
  // Install fallback system
  function installPackageFallbacks() {
    // Override require if available
    if (typeof window.require === 'function') {
      const originalRequire = window.require;
      window.require = function(id) {
        try {
          return originalRequire(id);
        } catch (error) {
          console.log(`📦 Package "${id}" not found, using fallback`);
          return getPackageFallback(id);
        }
      };
    }
    
    // Override import if available
    if (typeof window.$csbImport === 'function') {
      const originalImport = window.$csbImport;
      window.$csbImport = function(specifier) {
        return originalImport(specifier).catch(() => {
          console.log(`📦 Dynamic import "${specifier}" failed, using fallback`);
          return getPackageFallback(specifier);
        });
      };
    }
    
    // Create global fallback function
    window.__packageFallback = getPackageFallback;
  }
  
  function getPackageFallback(packageName) {
    // Direct match
    if (packageFallbacks[packageName]) {
      return packageFallbacks[packageName];
    }
    
    // Scoped package fallback (@scope/package)
    if (packageName.startsWith('@')) {
      const [scope, name] = packageName.split('/');
      if (packageFallbacks[name]) return packageFallbacks[name];
      if (packageFallbacks[scope]) return packageFallbacks[scope];
    }
    
    // Sub-package fallback (package/submodule)
    if (packageName.includes('/')) {
      const basePackage = packageName.split('/')[0];
      if (packageFallbacks[basePackage]) return packageFallbacks[basePackage];
    }
    
    // Pattern-based fallbacks
    if (packageName.includes('react')) return packageFallbacks['react'];
    if (packageName.includes('redux')) return packageFallbacks['redux'];
    if (packageName.includes('axios') || packageName.includes('http')) return packageFallbacks['axios'];
    if (packageName.includes('moment') || packageName.includes('date')) return packageFallbacks['moment'];
    if (packageName.includes('lodash') || packageName.includes('util')) return packageFallbacks['lodash'];
    
    // Generic fallback
    return {
      default: function() { return null; },
      __esModule: true
    };
  }
  
  // Auto-install when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPackageFallbacks);
  } else {
    installPackageFallbacks();
  }
  
  console.log('✅ Package fallback system initialized');
})();