/**
 * FullScreenService - Handles full-screen functionality with browser compatibility
 * Supports HTML5 Fullscreen API with fallbacks for unsupported browsers
 */

class FullScreenService {
  constructor() {
    this.isFullScreen = false;
    this.element = null;
    this.listeners = new Set();
    this.supported = this.checkSupport();

    // Bind methods to preserve context
    this.enterFullScreen = this.enterFullScreen.bind(this);
    this.exitFullScreen = this.exitFullScreen.bind(this);
    this.toggleFullScreen = this.toggleFullScreen.bind(this);
    this.handleFullScreenChange = this.handleFullScreenChange.bind(this);

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Check if full-screen API is supported
   */
  checkSupport() {
    const doc = document;
    return !!(
      doc.fullscreenEnabled ||
      doc.webkitFullscreenEnabled ||
      doc.mozFullScreenEnabled ||
      doc.msFullscreenEnabled
    );
  }

  /**
   * Get the appropriate full-screen API methods for the current browser
   */
  getFullScreenAPI() {
    const doc = document;
    const element = this.element || doc.documentElement;

    return {
      request:
        element.requestFullscreen ||
        element.webkitRequestFullscreen ||
        element.mozRequestFullScreen ||
        element.msRequestFullscreen,
      exit:
        doc.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.mozCancelFullScreen ||
        doc.msExitFullscreen,
      enabled:
        doc.fullscreenEnabled ||
        doc.webkitFullscreenEnabled ||
        doc.mozFullScreenEnabled ||
        doc.msFullscreenEnabled,
      element:
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement,
    };
  }

  /**
   * Set up event listeners for full-screen state changes
   */
  setupEventListeners() {
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ];

    events.forEach(event => {
      document.addEventListener(event, this.handleFullScreenChange, false);
    });

    // Listen for escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isFullScreen) {
        this.exitFullScreen();
      }
    });
  }

  /**
   * Handle full-screen state changes
   */
  handleFullScreenChange() {
    const api = this.getFullScreenAPI();
    const wasFullScreen = this.isFullScreen;
    this.isFullScreen = !!api.element;

    // Only notify if state actually changed
    if (wasFullScreen !== this.isFullScreen) {
      this.notifyListeners();
    }
  }

  /**
   * Enter full-screen mode
   */
  async enterFullScreen(element = null) {
    console.log('FullScreenService.enterFullScreen called with element:', element);

    if (!this.supported) {
      console.warn('Full-screen API not supported in this browser');
      return false;
    }

    try {
      this.element = element || document.documentElement;
      console.log('Using element for full-screen:', this.element);

      const api = this.getFullScreenAPI();
      console.log('Full-screen API methods:', api);

      if (api.request) {
        console.log('Requesting full-screen...');
        await api.request.call(this.element);
        console.log('Full-screen request completed');
        return true;
      } else {
        console.warn('Full-screen request method not available');
        return false;
      }
    } catch (error) {
      console.error('Error entering full-screen mode:', error);
      return false;
    }
  }

  /**
   * Exit full-screen mode
   */
  async exitFullScreen() {
    console.log('FullScreenService: exitFullScreen called');
    if (!this.supported) {
      console.warn('Full-screen not supported');
      return false;
    }

    try {
      const api = this.getFullScreenAPI();
      console.log('FullScreenService: exit API methods:', api);

      if (api.exit) {
        console.log('FullScreenService: calling exit method');
        await api.exit.call(document);
        console.log('FullScreenService: exit method completed');
        return true;
      } else {
        console.warn('Full-screen exit method not available');
        return false;
      }
    } catch (error) {
      console.error('Error exiting full-screen mode:', error);
      return false;
    }
  }

  /**
   * Toggle full-screen mode
   */
  async toggleFullScreen(element = null) {
    if (this.isFullScreen) {
      return await this.exitFullScreen();
    } else {
      return await this.enterFullScreen(element);
    }
  }

  /**
   * Get current full-screen state
   */
  getFullScreenState() {
    return {
      isFullScreen: this.isFullScreen,
      supported: this.supported,
      element: this.element,
    };
  }

  /**
   * Add event listener for full-screen changes
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Remove event listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of state changes
   */
  notifyListeners() {
    const state = this.getFullScreenState();
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in full-screen listener:', error);
      }
    });
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ];

    events.forEach(event => {
      document.removeEventListener(event, this.handleFullScreenChange, false);
    });

    this.listeners.clear();
  }
}

// Create singleton instance
const fullScreenService = new FullScreenService();

export default fullScreenService;
