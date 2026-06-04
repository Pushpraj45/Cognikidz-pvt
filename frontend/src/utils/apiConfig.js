// API Configuration utility
export const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:8004';
};

export const createApiUrl = endpoint => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};

// Helper function to make API calls with proper error handling
export const apiCall = async (endpoint, options = {}) => {
  const url = createApiUrl(endpoint);

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // Add credentials and mode for CORS
    mode: 'cors',
    credentials: 'omit',
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('API call error:', {
      url,
      error: error.message,
      options: { ...defaultOptions, ...options },
    });
    throw error;
  }
};

// Debug function to test API connectivity
export const testBackendConnection = async () => {
  const baseUrl = getApiBaseUrl();
  const endpoints = ['/api/health', '/api/feedback/status'];
  const results = {};

  for (const endpoint of endpoints) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
      results[endpoint] = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : null,
      };
    } catch (error) {
      results[endpoint] = {
        error: error.message,
      };
    }
  }

  return results;
};

export default { getApiBaseUrl, createApiUrl, apiCall };
