const mongoose = require('mongoose');
require('dotenv').config();

// Import logger
const logger = require('../utils/logger');

const User = require('../domains/auth/model');
const { UserPurchase } = require('../domains/pricing/model');

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    logger.error('❌ Please provide an email address');
    logger.info('Usage: npm run add-test-user <email>');
    process.exit(1);
}

const ALL_ASSESSMENTS = [
    'autism-form', 'adhd-form', 'dyslexia-form', 'autism-image', 
    'adhd-game', 'dyslexia-game', 'general-form'
];

const ALL_PACKAGES = [
    'autism-essential', 'adhd-core', 'dyslexia-core', 
    'general-neuro-check', 'dual-insight-pack', 'all-inclusive-pack'
];

async function addTestUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('✅ Connected to MongoDB');

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            logger.warn(`❌ User not found: ${email}`);
            process.exit(1);
        }

        // Make user admin
        user.isAdmin = true;
        await user.save();
        logger.info(`✅ Made ${email} admin`);

        // Grant access to all assessments and packages
        for (const assessmentType of ALL_ASSESSMENTS) {
            const existingPurchase = await UserPurchase.findOne({
                userId: user._id,
                assessmentType,
                paymentStatus: 'completed'
            });

            if (!existingPurchase) {
                const purchase = new UserPurchase({
                    userId: user._id,
                    purchaseType: 'individual',
                    assessmentType,
                    amount: 0,
                    currency: 'INR',
                    paymentMethod: 'admin-granted',
                    paymentStatus: 'completed',
                    isActive: true
                });
                await purchase.save();
                logger.info(`✅ Granted ${assessmentType} access`);
            }
        }

        for (const packageId of ALL_PACKAGES) {
            const existingPurchase = await UserPurchase.findOne({
                userId: user._id,
                packageId,
                paymentStatus: 'completed'
            });

            if (!existingPurchase) {
                const purchase = new UserPurchase({
                    userId: user._id,
                    purchaseType: 'combo',
                    packageId,
                    amount: 0,
                    currency: 'INR',
                    paymentMethod: 'admin-granted',
                    paymentStatus: 'completed',
                    isActive: true
                });
                await purchase.save();
                logger.info(`✅ Granted ${packageId} access`);
            }
        }

        logger.info(`🎉 Successfully granted access to ${email}`);
        process.exit(0);
    } catch (error) {
        logger.error('❌ Error:', error);
        process.exit(1);
    }
}

addTestUser();
