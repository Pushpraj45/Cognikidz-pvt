const router = require("./routes");
const { Bookmark } = require("./model");
const bookmarkController = require("./controller");

module.exports = {
  router,
  models: {
    Bookmark,
  },
  controllers: {
    bookmark: bookmarkController,
  },
}; 