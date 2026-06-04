// Environment test utility
export const testEnvironment = () => {
  const envInfo = {
    apiUrl:
      process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  };

  return envInfo;
};

export const testApiConnection = async () => {
  const envInfo = testEnvironment();

  try {
    const response = await fetch(`${envInfo.apiUrl}/api/health`);
    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data: data,
      url: envInfo.apiUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url: envInfo.apiUrl,
    };
  }
};
