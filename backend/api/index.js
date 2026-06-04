// Vercel serverless entry — re-exports Express app from server.js
const app = require("../server");

module.exports = app;
