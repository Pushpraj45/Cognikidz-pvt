const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Import logger
const logger = require('../backend/utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8004';

// Configure proxy middleware for API requests
app.use(
  '/api',
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    // Keep the /api prefix when forwarding to backend
    // pathRewrite: {
    //   '^/api': '/', // Remove /api prefix when forwarding
    // },
    onProxyReq: (proxyReq, req, res) => {
      logger.info(`Proxying request to: ${BACKEND_URL}${proxyReq.path}`);
    },
    onError: (err, req, res) => {
      logger.error('Proxy error:', err);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    },
  })
);

// Special routes that don't have the /api prefix
const backendRoutes = ['/api/start-assessment', '/api/assessment'];
backendRoutes.forEach(route => {
  app.use(
    route,
    createProxyMiddleware({
      target: BACKEND_URL,
      changeOrigin: true,
      pathRewrite: path => {
        // Only rewrite if it's an API route
        if (
          path.startsWith('/api/assessment/') &&
          (path.includes('/answer') ||
            path.includes('/pause') ||
            path.includes('/resume') ||
            path.includes('/results'))
        ) {
          return path;
        }
        // Don't rewrite for frontend routes
        return null;
      },
      onProxyReq: (proxyReq, req, res) => {
        logger.info(`Proxying special route request to: ${BACKEND_URL}${proxyReq.path}`);
      },
    })
  );
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the test-app directory
app.use('/test-app', express.static(path.join(__dirname, 'test-app')));

// Serve static files from the build directory if it exists
app.use(express.static(path.join(__dirname, 'build')));

// Serve the test app
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-app', 'index.html'));
});

// Handle React routing, return all requests to React app
app.get('*', function (req, res) {
  // Try to send the index.html from public folder
  const publicIndexPath = path.join(__dirname, 'public', 'index.html');
  const buildIndexPath = path.join(__dirname, 'build', 'index.html');

  // First try to send from public folder
  if (require('fs').existsSync(publicIndexPath)) {
    return res.sendFile(publicIndexPath);
  }

  // Then try from build folder
  if (require('fs').existsSync(buildIndexPath)) {
    return res.sendFile(buildIndexPath);
  }

  // If neither exists, send a simple HTML response
  res.send(`
    <html>
      <head><title>CogniKidz App</title></head>
      <body>
        <h1>Welcome to CogniKidz</h1>
        <p>The main app isn't available, but you can check the test app:</p>
        <p><a href="/test">Simple React Test App</a></p>
        <p><a href="/test-app">Test App Directory</a></p>
        <p><a href="/test.html">Test HTML Page</a></p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  logger.info(`Express server running at http://localhost:${PORT}`);
  logger.info(`Backend proxy configured to: ${BACKEND_URL}`);
  logger.info(`Test page available at http://localhost:${PORT}/test`);
});
