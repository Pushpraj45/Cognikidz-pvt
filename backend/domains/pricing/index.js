const router = require('./routes');
const controller = require('./controller');
const { AssessmentPricing, ComboPackage, UserPurchase, PricingConfig } = require('./model');

module.exports = {
    router,
    controller,
    models: {
        AssessmentPricing,
        ComboPackage,
        UserPurchase,
        PricingConfig,
    },
}; 