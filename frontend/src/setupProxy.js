const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Only setup proxy in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Proxy] Setting up proxy middleware to http://localhost:8004');

    // Setup proxy for all API routes to backend
    const apiProxy = createProxyMiddleware({
      target: 'http://localhost:8004',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] >> Proxying ${req.method} request:`, req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy] << Response ${proxyRes.statusCode} for ${req.method}:`, req.url);
      },
      onError: (err, req, res) => {
        console.error(`[Proxy] !! Error proxying ${req.method} ${req.url}:`, err.message);
      },
    });

    // Use the proxy for all API routes
    app.use('/api', apiProxy);
  } else {
    console.log('[Proxy] Production mode - no proxy setup needed');
  }
};
