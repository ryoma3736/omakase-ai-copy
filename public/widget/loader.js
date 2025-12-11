/**
 * Omakase AI Widget Loader
 * Embeddable script for external websites
 * Version: 1.0.0
 */

(function() {
  'use strict';

  // Prevent double initialization
  if (window.__OMAKASE_LOADER_INITIALIZED__) {
    console.warn('Omakase Widget: Already initialized');
    return;
  }

  window.__OMAKASE_LOADER_INITIALIZED__ = true;

  // Configuration
  var config = {
    apiBase: 'https://api.omakase.ai', // Production URL
    cdnBase: 'https://widget.omakase.ai',
    widgetId: null,
    debug: false
  };

  // Development detection
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    config.apiBase = window.location.origin;
    config.cdnBase = window.location.origin;
    config.debug = true;
  }

  // Parse widget ID from script tag
  function getWidgetId() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src;
      if (src && src.indexOf('loader.js') !== -1) {
        var match = src.match(/[?&]id=([^&]+)/);
        if (match) return match[1];
      }
    }
    return null;
  }

  config.widgetId = getWidgetId();

  // Debug logging
  function debug() {
    if (config.debug && console && console.log) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[Omakase Widget]');
      console.log.apply(console, args);
    }
  }

  // Error handling
  function error() {
    if (console && console.error) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[Omakase Widget Error]');
      console.error.apply(console, args);
    }
  }

  // Validate configuration
  if (!config.widgetId) {
    error('Widget ID not found. Please check the installation code.');
    return;
  }

  debug('Initializing widget', config.widgetId);

  // Fetch widget configuration
  function fetchWidgetConfig(callback) {
    var xhr = new XMLHttpRequest();
    var url = config.apiBase + '/api/v1/widget_info?id=' + config.widgetId;

    debug('Fetching config from:', url);

    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          debug('Widget config loaded:', data);
          callback(null, data);
        } catch (e) {
          error('Failed to parse widget config:', e);
          callback(e, null);
        }
      } else {
        error('Failed to fetch widget config. Status:', xhr.status);
        callback(new Error('HTTP ' + xhr.status), null);
      }
    };

    xhr.onerror = function() {
      error('Network error while fetching widget config');
      callback(new Error('Network error'), null);
    };

    xhr.send();
  }

  // Create widget container
  function createWidgetContainer(widgetConfig) {
    debug('Creating widget container');

    var container = document.createElement('div');
    container.id = 'omakase-widget-root';
    container.setAttribute('data-widget-id', config.widgetId);
    container.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;';

    // Position based on config
    var position = widgetConfig.theme.position || 'bottom-right';
    if (position === 'bottom-right') {
      container.style.bottom = '20px';
      container.style.right = '20px';
    } else if (position === 'bottom-left') {
      container.style.bottom = '20px';
      container.style.left = '20px';
    }

    document.body.appendChild(container);

    // Load widget script
    loadWidgetScript(widgetConfig);
  }

  // Load widget script bundle
  function loadWidgetScript(widgetConfig) {
    debug('Loading widget script bundle');

    // Check if React and ReactDOM are available
    if (!window.React || !window.ReactDOM) {
      debug('Loading React from CDN');
      loadScript('https://unpkg.com/react@18/umd/react.production.min.js', function() {
        loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', function() {
          initializeWidget(widgetConfig);
        });
      });
    } else {
      debug('React already loaded');
      initializeWidget(widgetConfig);
    }
  }

  // Load external script
  function loadScript(src, callback) {
    var script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = callback;
    script.onerror = function() {
      error('Failed to load script:', src);
    };
    document.head.appendChild(script);
  }

  // Initialize widget with configuration
  function initializeWidget(widgetConfig) {
    debug('Initializing widget with config:', widgetConfig);

    // Check if OmakaseWidget global is available
    if (typeof window.OmakaseWidget !== 'undefined') {
      debug('Using existing OmakaseWidget');
      window.OmakaseWidget.init({
        agentId: widgetConfig.agentId,
        agentName: widgetConfig.agent.name,
        position: widgetConfig.theme.position,
        theme: widgetConfig.theme.theme || 'light',
        primaryColor: widgetConfig.theme.primaryColor,
        welcomeMessage: widgetConfig.agent.greeting,
        apiBaseUrl: config.apiBase,
        showBranding: widgetConfig.theme.showBranding
      });
    } else {
      error('OmakaseWidget not found. Please ensure widget.js is loaded.');
      // Fallback: load widget.js from CDN
      loadScript(config.cdnBase + '/widget.js', function() {
        if (window.OmakaseWidget) {
          window.OmakaseWidget.init({
            agentId: widgetConfig.agentId,
            agentName: widgetConfig.agent.name,
            position: widgetConfig.theme.position,
            theme: widgetConfig.theme.theme || 'light',
            primaryColor: widgetConfig.theme.primaryColor,
            welcomeMessage: widgetConfig.agent.greeting,
            apiBaseUrl: config.apiBase,
            showBranding: widgetConfig.theme.showBranding
          });
        } else {
          error('Failed to initialize widget');
        }
      });
    }
  }

  // Queue for commands before widget is loaded
  var commandQueue = [];

  // Process queued commands
  function processQueue() {
    if (commandQueue.length > 0) {
      debug('Processing', commandQueue.length, 'queued commands');
      commandQueue.forEach(function(cmd) {
        if (window.OmakaseWidget && typeof window.OmakaseWidget[cmd.method] === 'function') {
          window.OmakaseWidget[cmd.method].apply(window.OmakaseWidget, cmd.args);
        }
      });
      commandQueue = [];
    }
  }

  // Public API
  window.omakase = window.omakase || function() {
    var args = Array.prototype.slice.call(arguments);
    var method = args[0];
    var params = args.slice(1);

    if (window.OmakaseWidget && typeof window.OmakaseWidget[method] === 'function') {
      window.OmakaseWidget[method].apply(window.OmakaseWidget, params);
    } else {
      debug('Queueing command:', method);
      commandQueue.push({ method: method, args: params });
    }
  };

  // Start loading
  fetchWidgetConfig(function(err, widgetConfig) {
    if (err) {
      error('Failed to initialize widget:', err);
      return;
    }

    createWidgetContainer(widgetConfig);

    // Process any queued commands
    setTimeout(processQueue, 1000);
  });

  debug('Loader initialized');
})();
