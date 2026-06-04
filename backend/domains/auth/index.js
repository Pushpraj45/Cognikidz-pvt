// Auth Domain - Main exports
const controller = require('./controller');
const routes = require('./routes');
const model = require('./model');
const middleware = require('./middleware');
const service = require('./service');
const validator = require('./validator');

module.exports = {
  controller,
  routes,
  model,
  middleware,
  service,
  validator
};
