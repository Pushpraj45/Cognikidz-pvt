// Assessment Domain - Main exports
const routes = require('./routes');
const model = require('./model');
const controller = require('./controller');
const { BatteryConfig } = require('./battery-model');
const { ChildProgress } = require('./child-progress-model');

module.exports = {
  routes,
  model,
  controller,
  BatteryConfig,
  ChildProgress
};
