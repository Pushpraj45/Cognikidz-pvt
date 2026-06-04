const { AssessmentPricing, ComboPackage, UserPurchase, PricingConfig } = require('./model');
const RazorpayService = require('./razorpay.service');
const User = require('../auth/model');
const { sendEmail } = require('../../config/mail');

/**
 * Get all active assessment pricing
 */
const getAssessmentPricing = async (req, res) => {
    try {
        const pricing = await AssessmentPricing.find({ isActive: true }).sort({ category: 1, priceINR: 1 });

        res.json({
            success: true,
            data: pricing,
        });
    } catch (error) {
        console.error('Error fetching assessment pricing:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pricing information',
        });
    }
};

/**
 * Get all active combo packages
 */
const getComboPackages = async (req, res) => {
    try {
        const packages = await ComboPackage.find({ isActive: true }).sort({ priceINR: 1 });

        res.json({
            success: true,
            data: packages,
        });
    } catch (error) {
        console.error('Error fetching combo packages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch package information',
        });
    }
};

/**
 * Get pricing for a specific assessment type
 */
const getAssessmentPrice = async (req, res) => {
    try {
        const { assessmentType } = req.params;

        const pricing = await AssessmentPricing.findOne({
            assessmentType,
            isActive: true
        });

        if (!pricing) {
            return res.status(404).json({
                success: false,
                message: 'Pricing not found for this assessment type',
            });
        }

        res.json({
            success: true,
            data: pricing,
        });
    } catch (error) {
        console.error('Error fetching assessment price:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pricing information',
        });
    }
};

/**
 * Check if user has access to an assessment
 */
const checkUserAccess = async (req, res) => {
    try {
        const { assessmentType } = req.params;
        const userId = req.user._id;

        // Check if user is admin
        const user = await User.findById(userId);
        if (user.isAdmin) {
            return res.json({
                success: true,
                hasAccess: true,
                reason: 'admin_access',
            });
        }

        // Check if pricing is enabled
        const config = await PricingConfig.findOne();
        if (!config || !config.isPricingEnabled) {
            return res.json({
                success: true,
                hasAccess: true,
                reason: 'pricing_disabled',
            });
        }

        // Derive equivalent assessment types for access checks
        // Example: combo including "autism-form" should grant access to "autism-image"
        const equivalentTypesForCombo = [assessmentType];
        if (assessmentType && assessmentType.endsWith('-image')) {
            const base = assessmentType.replace(/-image$/, '');
            equivalentTypesForCombo.push(`${base}-form`);
        }

        // Check if user has purchased this assessment (individual purchases require exact match)
        const purchase = await UserPurchase.findOne({
            userId,
            assessmentType,
            paymentStatus: 'completed',
            isActive: true,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } }
            ]
        });

        if (purchase) {
            return res.json({
                success: true,
                hasAccess: true,
                reason: 'purchased',
                purchaseId: purchase._id,
            });
        }

        // Check if user has purchased a combo package that includes this assessment
        const comboPurchase = await UserPurchase.findOne({
            userId,
            purchaseType: 'combo',
            paymentStatus: 'completed',
            isActive: true,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } }
            ]
        });

        if (comboPurchase) {
            const packageDetails = await ComboPackage.findOne({
                packageId: comboPurchase.packageId,
                isActive: true
            });

            if (packageDetails && packageDetails.includedAssessments.some(a => equivalentTypesForCombo.includes(a.assessmentType))) {
                return res.json({
                    success: true,
                    hasAccess: true,
                    reason: 'combo_package',
                    packageId: comboPurchase.packageId,
                });
            }
        }

        // User doesn't have access, return pricing information
        const pricing = await AssessmentPricing.findOne({
            assessmentType,
            isActive: true
        });

        res.json({
            success: true,
            hasAccess: false,
            reason: 'payment_required',
            pricing: pricing || null,
        });
    } catch (error) {
        console.error('Error checking user access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check access',
        });
    }
};

/**
 * Create a purchase record (for admin-granted access)
 */
const createPurchase = async (req, res) => {
    try {
        const { purchaseType, assessmentType, packageId, amount, currency, paymentMethod, expiresAt } = req.body;
        const userId = req.user._id;

        const purchaseData = {
            userId,
            purchaseType,
            amount,
            currency,
            paymentMethod,
            paymentStatus: 'completed', // Admin-granted purchases are immediately completed
        };

        if (purchaseType === 'individual') {
            purchaseData.assessmentType = assessmentType;
        } else if (purchaseType === 'combo') {
            purchaseData.packageId = packageId;
        }

        if (expiresAt) {
            purchaseData.expiresAt = new Date(expiresAt);
        }

        const purchase = new UserPurchase(purchaseData);
        await purchase.save();

        res.json({
            success: true,
            message: 'Purchase created successfully',
            data: purchase,
        });
    } catch (error) {
        console.error('Error creating purchase:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create purchase',
        });
    }
};

/**
 * Get user's purchase history
 */
const getUserPurchases = async (req, res) => {
    try {
        const userId = req.user._id;

        const purchases = await UserPurchase.find({ userId })
            .sort({ createdAt: -1 })
            .populate('userId', 'firstName lastName email');

        res.json({
            success: true,
            data: purchases,
        });
    } catch (error) {
        console.error('Error fetching user purchases:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchase history',
        });
    }
};

// Aggregate allowances per base assessment type for "Your Assessments"
const getUserEntitlements = async (req, res) => {
    try {
        const userId = req.user._id;
        const purchases = await UserPurchase.find({ userId, paymentStatus: 'completed', isActive: true });
        const usageModule = require('./usage');
        const normalizeBaseType = usageModule && usageModule.normalizeBaseType ? usageModule.normalizeBaseType : (t => String(t || '').split('-')[0]);

        const summary = {};
        const limitPer = { assessment: 1, game: 3, suite: 1 };

        for (const p of purchases) {
            const list = [];
            if (p.purchaseType === 'individual') {
                list.push(p.assessmentType);
            } else if (p.purchaseType === 'combo') {
                const pkg = await ComboPackage.findOne({ packageId: p.packageId, isActive: true });
                if (pkg && Array.isArray(pkg.includedAssessments)) {
                    list.push(...pkg.includedAssessments.map(a => a.assessmentType));
                }
            }
            for (const t of list) {
                const base = normalizeBaseType(t);
                if (!base) continue;
                if (!summary[base]) summary[base] = { purchased: 0, used: 0, remaining: 0 };
                // Determine resource type from key
                const resourceType = t.includes('-game') ? 'game' : 'assessment';
                summary[base].purchased += (resourceType === 'game' ? limitPer.game : limitPer.assessment);
            }
        }

        // Sum usage across all covering purchases per base
        for (const base of Object.keys(summary)) {
            // Gather all purchases that cover base
            const covering = [];
            for (const p of purchases) {
                const list = [];
                if (p.purchaseType === 'individual') list.push(p.assessmentType);
                else {
                    const pkg = await ComboPackage.findOne({ packageId: p.packageId, isActive: true });
                    if (pkg) list.push(...pkg.includedAssessments.map(a => a.assessmentType));
                }
                const covers = list.some(t => normalizeBaseType(t) === base);
                if (covers) covering.push(p);
            }
            let used = 0;
            for (const p of covering) {
                const purchaseUsage = p.metadata?.usage || {};
                // Consider both form and image usage keys for this base
                used += (purchaseUsage[`${base}-form`] || 0);
                used += (purchaseUsage[`${base}-image`] || 0);
                // Games
                used += (purchaseUsage[`${base}-game`] || 0);
            }
            summary[base].used = used;
            summary[base].remaining = Math.max(0, summary[base].purchased - used);
        }

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Error fetching entitlements:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch entitlements' });
    }
};

/**
 * Admin: Grant free access to a user
 */
const grantFreeAccess = async (req, res) => {
    try {
        const { userId, assessmentType, packageId, expiresAt } = req.body;

        // Check if current user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required',
            });
        }

        const purchaseData = {
            userId,
            purchaseType: packageId ? 'combo' : 'individual',
            amount: 0,
            currency: 'INR',
            paymentMethod: 'admin-granted',
            paymentStatus: 'completed',
        };

        if (packageId) {
            purchaseData.packageId = packageId;
        } else {
            purchaseData.assessmentType = assessmentType;
        }

        if (expiresAt) {
            purchaseData.expiresAt = new Date(expiresAt);
        }

        const purchase = new UserPurchase(purchaseData);
        await purchase.save();

        res.json({
            success: true,
            message: 'Free access granted successfully',
            data: purchase,
        });
    } catch (error) {
        console.error('Error granting free access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to grant free access',
        });
    }
};

/**
 * Admin: Update pricing configuration
 */
const updatePricingConfig = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required',
            });
        }

        const config = await PricingConfig.findOne();
        if (config) {
            Object.assign(config, req.body);
            await config.save();
        } else {
            const newConfig = new PricingConfig(req.body);
            await newConfig.save();
        }

        res.json({
            success: true,
            message: 'Pricing configuration updated successfully',
        });
    } catch (error) {
        console.error('Error updating pricing config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update pricing configuration',
        });
    }
};

/**
 * Get pricing configuration
 */
const getPricingConfig = async (req, res) => {
    try {
        const config = await PricingConfig.findOne();

        res.json({
            success: true,
            data: config || {
                isPricingEnabled: true,
                adminEmails: [],
                freeAccessDomains: [],
                discountCodes: [],
                currency: {
                    default: 'INR',
                    exchangeRate: 0.0217,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching pricing config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pricing configuration',
        });
    }
};

module.exports = {
    getAssessmentPricing,
    getComboPackages,
    getAssessmentPrice,
    checkUserAccess,
    createPurchase,
    getUserPurchases,
    grantFreeAccess,
    updatePricingConfig,
    getPricingConfig,
}; 

/**
 * Create a Razorpay order and a pending purchase record
 */
const createRazorpayOrder = async (req, res) => {
    try {
        const { purchaseType, assessmentType, packageId, currency = 'INR', discountCode } = req.body;
        const userId = req.user._id;

        if (!['individual', 'combo'].includes(purchaseType)) {
            return res.status(400).json({ success: false, message: 'Invalid purchase type' });
        }

        // Derive amount from DB to prevent tampering
        let amountMajorUnits = 0;
        let title = '';
        if (purchaseType === 'individual') {
            const pricing = await AssessmentPricing.findOne({ assessmentType, isActive: true });
            if (!pricing) {
                return res.status(404).json({ success: false, message: 'Assessment not found' });
            }
            amountMajorUnits = currency === 'USD' ? pricing.priceUSD : pricing.priceINR;
            title = pricing.assessmentName || assessmentType;
        } else {
            const pkg = await ComboPackage.findOne({ packageId, isActive: true });
            if (!pkg) {
                return res.status(404).json({ success: false, message: 'Package not found' });
            }
            amountMajorUnits = currency === 'USD' ? pkg.priceUSD : pkg.priceINR;
            title = pkg.packageName || packageId;
        }

        // Apply discount code if valid
        let appliedDiscount = null;
        if (discountCode) {
            const config = await PricingConfig.findOne();
            const code = (config?.discountCodes || []).find(c => (
                c.code?.toLowerCase() === String(discountCode).toLowerCase() &&
                c.isActive && (!c.expiresAt || new Date(c.expiresAt) > new Date()) &&
                (c.maxUses < 0 || (c.usedCount || 0) < c.maxUses)
            ));
            if (code) {
                const pct = Math.max(0, Math.min(100, Number(code.discountPercentage)));
                const discounted = Number(amountMajorUnits) * (1 - pct / 100);
                // Minor rounding based on currency
                amountMajorUnits = currency === 'USD' ? Math.round(discounted * 100) / 100 : Math.round(discounted);
                appliedDiscount = { code: code.code, discountPercentage: pct };
            }
        }

        // Create pending purchase
        const purchaseData = {
            userId,
            purchaseType,
            amount: amountMajorUnits,
            currency,
            paymentMethod: 'razorpay',
            paymentStatus: 'pending',
        };

        if (purchaseType === 'individual') {
            purchaseData.assessmentType = assessmentType;
        } else {
            purchaseData.packageId = packageId;
        }

        const purchase = new UserPurchase(purchaseData);
        if (appliedDiscount) {
            purchase.metadata = { ...(purchase.metadata || {}), appliedDiscount };
        }
        await purchase.save();

        // Convert to minor units for Razorpay
        const amountInMinor = Math.round(Number(amountMajorUnits) * 100);

        const order = await RazorpayService.createOrder({
            amountInMinor,
            currency,
            receipt: String(purchase._id),
            notes: {
                purchaseId: String(purchase._id),
                purchaseType,
                assessmentType: assessmentType || '',
                packageId: packageId || '',
                userId: String(userId),
                title,
                discountCode: appliedDiscount?.code || '',
            },
        });

        // Store order info in metadata
        purchase.metadata = {
            ...(purchase.metadata || {}),
            razorpayOrderId: order.id,
            razorpayAmount: order.amount,
            razorpayCurrency: order.currency,
        };
        await purchase.save();

        res.json({
            success: true,
            data: {
                keyId: process.env.RAZORPAY_KEY_ID,
                order,
                purchaseId: String(purchase._id),
                title,
                appliedDiscount,
            },
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment order' });
    }
};

/**
 * Verify Razorpay payment signature and mark purchase completed
 */
const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const isValid = RazorpayService.verifyCheckoutSignature({
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
        });

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Find pending purchase by order id in metadata
        const purchase = await UserPurchase.findOne({
            'metadata.razorpayOrderId': razorpay_order_id,
            userId: req.user._id,
        });

        if (!purchase) {
            return res.status(404).json({ success: false, message: 'Purchase not found' });
        }

        purchase.paymentId = razorpay_payment_id;
        purchase.paymentStatus = 'completed';
        purchase.metadata = {
            ...(purchase.metadata || {}),
            razorpaySignature: razorpay_signature,
            verifiedAt: new Date().toISOString(),
        };
        await purchase.save();

        // If discount applied, increment usage count for the code
        try {
            if (purchase.metadata?.appliedDiscount?.code) {
                const config = await PricingConfig.findOne();
                if (config && Array.isArray(config.discountCodes)) {
                    const idx = config.discountCodes.findIndex(c => c.code?.toLowerCase() === purchase.metadata.appliedDiscount.code.toLowerCase());
                    if (idx >= 0) {
                        config.discountCodes[idx].usedCount = (config.discountCodes[idx].usedCount || 0) + 1;
                        await config.save();
                    }
                }
            }
        } catch (e) {
            console.warn('Coupon usage increment failed:', e.message);
        }

        // Send confirmation email (best-effort)
        try {
            const user = req.user;
            const title = purchase.purchaseType === 'combo' ? purchase.packageId : purchase.assessmentType;
            await sendEmail({
                email: user.email,
                subject: 'Payment Successful - CogniKidz',
                html: `
                  <div style="font-family: Arial, sans-serif; color: #111;">
                    <h2>Thank you for your purchase!</h2>
                    <p>Hi ${user.firstName || user.name || ''},</p>
                    <p>Your payment has been received successfully.</p>
                    <ul>
                      <li><strong>Item:</strong> ${title}</li>
                      <li><strong>Amount:</strong> ${purchase.currency} ${purchase.amount}</li>
                      <li><strong>Payment ID:</strong> ${purchase.paymentId}</li>
                      <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
                    </ul>
                    <p>You can now access your assessments from your dashboard.</p>
                    <p>— CogniKidz Team</p>
                  </div>
                `,
                text: `Payment successful for ${title}. Amount: ${purchase.currency} ${purchase.amount}. Payment ID: ${purchase.paymentId}.`,
            });
        } catch (mailError) {
            console.warn('Email send failed:', mailError.message);
        }

        res.json({ success: true, message: 'Payment verified', data: { purchaseId: String(purchase._id) } });
    } catch (error) {
        console.error('Error verifying Razorpay payment:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};

module.exports.createRazorpayOrder = createRazorpayOrder;
module.exports.verifyRazorpayPayment = verifyRazorpayPayment;
module.exports.getUserEntitlements = getUserEntitlements;

// List active coupons
module.exports.getActiveCoupons = async (req, res) => {
    try {
        const config = await PricingConfig.findOne();
        const now = new Date();
        const active = (config?.discountCodes || []).filter(c => c.isActive && (!c.expiresAt || new Date(c.expiresAt) > now) && (c.maxUses < 0 || (c.usedCount || 0) < c.maxUses)).map(c => ({
            code: c.code,
            discountPercentage: c.discountPercentage,
            expiresAt: c.expiresAt || null,
        }));
        res.json({ success: true, data: active });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
    }
};