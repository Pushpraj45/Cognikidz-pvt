// Article Domain - Main exports
const controller = require('./controller');
const routes = require('./routes');
const model = require('./model');
const service = require('./service');
const validator = require('./validator');

module.exports = {
  controller,
  routes,
  model,
  service,
  validator
};
