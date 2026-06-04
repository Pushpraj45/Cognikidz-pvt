const mongoose = require("mongoose");

/**
 * Individual Assessment Pricing Schema
 */
const AssessmentPricingSchema = new mongoose.Schema({
    assessmentType: {
        type: String,
        required: true,
        enum: ['adhd-form', 'autism-form', 'dyslexia-form', 'general-form', 'autism-image', 'adhd-game', 'dyslexia-game', 'autism-game'],
    },
    assessmentName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    priceINR: {
        type: Number,
        required: true,
        min: 0,
    },
    priceUSD: {
        type: Number,
        required: true,
        min: 0,
    },
    features: [{
        type: String,
    }],
    duration: {
        type: String,
        default: '15-20 minutes',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    category: {
        type: String,
        enum: ['form-based', 'image-based', 'game-based'],
        required: true,
    },
}, {
    timestamps: true,
});

/**
 * Combo Package Pricing Schema
 */
const ComboPackageSchema = new mongoose.Schema({
    packageId: {
        type: String,
        required: true,
        unique: true,
    },
    packageName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    priceINR: {
        type: Number,
        required: true,
        min: 0,
    },
    priceUSD: {
        type: Number,
        required: true,
        min: 0,
    },
    originalPriceINR: {
        type: Number,
        required: true,
        min: 0,
    },
    originalPriceUSD: {
        type: Number,
        required: true,
        min: 0,
    },
    savingsINR: {
        type: Number,
        required: true,
    },
    savingsUSD: {
        type: Number,
        required: true,
    },
    includedAssessments: [{
        assessmentType: {
            type: String,
            required: true,
        },
        assessmentName: {
            type: String,
            required: true,
        },
    }],
    additionalFeatures: [{
        type: String,
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    isPopular: {
        type: Boolean,
        default: false,
    },
    isBestValue: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

/**
 * User Subscription/Purchase Schema
 */
const UserPurchaseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    purchaseType: {
        type: String,
        enum: ['individual', 'combo'],
        required: true,
    },
    assessmentType: {
        type: String,
        required: function () {
            return this.purchaseType === 'individual';
        },
    },
    packageId: {
        type: String,
        required: function () {
            return this.purchaseType === 'combo';
        },
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        enum: ['INR', 'USD'],
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'stripe', 'paypal', 'admin-granted'],
        required: true,
    },
    paymentId: {
        type: String,
    },
    expiresAt: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});

/**
 * Admin Pricing Configuration Schema
 */
const PricingConfigSchema = new mongoose.Schema({
    isPricingEnabled: {
        type: Boolean,
        default: true,
    },
    adminEmails: [{
        type: String,
        required: true,
    }],
    freeAccessDomains: [{
        type: String,
    }],
    discountCodes: [{
        code: {
            type: String,
            required: true,
        },
        discountPercentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        maxUses: {
            type: Number,
            default: -1, // -1 means unlimited
        },
        usedCount: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        expiresAt: {
            type: Date,
        },
    }],
    currency: {
        default: {
            type: String,
            enum: ['INR', 'USD'],
            default: 'INR',
        },
        exchangeRate: {
            type: Number,
            default: 0.0217, // 1 INR = 0.0217 USD (approximate)
        },
    },
}, {
    timestamps: true,
});

// Create models
const AssessmentPricing = mongoose.model('AssessmentPricing', AssessmentPricingSchema);
const ComboPackage = mongoose.model('ComboPackage', ComboPackageSchema);
const UserPurchase = mongoose.model('UserPurchase', UserPurchaseSchema);
const PricingConfig = mongoose.model('PricingConfig', PricingConfigSchema);

module.exports = {
    AssessmentPricing,
    ComboPackage,
    UserPurchase,
    PricingConfig,
}; 