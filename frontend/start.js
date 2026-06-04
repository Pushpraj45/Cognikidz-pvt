const { spawn } = require('child_process');
const path = require('path');

// Import logger
const logger = require('../backend/utils/logger');

logger.info('Starting React App...');
logger.info('Current directory:', process.cwd());

// Use the local react-scripts from node_modules
const reactScriptsPath = path.resolve(process.cwd(), 'node_modules', '.bin', 'react-scripts');
logger.info('React scripts path:', reactScriptsPath);

// Spawn the process
const child = spawn('node', [reactScriptsPath, 'start'], {
  stdio: 'inherit',
  shell: true,
});

child.on('error', error => {
  logger.error('Failed to start process:', error);
});

child.on('exit', (code, signal) => {
  if (code !== 0) {
    logger.error(`Process exited with code ${code} and signal ${signal}`);
  }
});
