import fullScreenService from '../FullScreenService';

describe('FullScreenService', () => {
  beforeEach(() => {
    // Mock document methods
    Object.defineProperty(document, 'fullscreenEnabled', {
      writable: true,
      value: true,
    });

    Object.defineProperty(document, 'exitFullscreen', {
      writable: true,
      value: jest.fn(),
    });

    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      writable: true,
      value: jest.fn(),
    });
  });

  test('should check browser support correctly', () => {
    const state = fullScreenService.getFullScreenState();
    expect(state.supported).toBe(true);
  });

  test('should handle full-screen state changes', () => {
    const mockCallback = jest.fn();
    const unsubscribe = fullScreenService.addListener(mockCallback);

    // Simulate full-screen change
    fullScreenService.handleFullScreenChange();

    expect(mockCallback).toHaveBeenCalled();

    unsubscribe();
  });

  test('should provide proper API methods', () => {
    const api = fullScreenService.getFullScreenAPI();
    expect(api).toHaveProperty('request');
    expect(api).toHaveProperty('exit');
    expect(api).toHaveProperty('enabled');
    expect(api).toHaveProperty('element');
  });

  test('should handle unsupported browsers gracefully', () => {
    // Mock unsupported browser
    Object.defineProperty(document, 'fullscreenEnabled', {
      writable: true,
      value: false,
    });

    const newService = new (require('../FullScreenService').default.constructor)();
    const state = newService.getFullScreenState();
    expect(state.supported).toBe(false);
  });
});
