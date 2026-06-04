const mongoose = require('mongoose');
require('dotenv').config();

// Import logger
const logger = require('./utils/logger');

// Import models
const User = require('./domains/auth/model');
const { UserPurchase } = require('./domains/pricing/model');

// Test user emails - you can easily modify this array
const TEST_USERS = [
    'prinshukush626@gmail.com',
    '10verma2002aman@gmail.com',
    'aman.verma2021@vitbhopal.ac.in',
    'devendrasahu3837@gmail.com',
    'dev666146@gmail.com',
    'sarathetanjul@gmail.com',
    'ejoty95@gmail.com',
    'cognikidzcare@gmail.com',
    'pushprajdubey20@gmail.com'
];

// All assessment types and packages
const ALL_ASSESSMENTS = [
    'autism-form', 'adhd-form', 'dyslexia-form', 'autism-image', 
    'adhd-game', 'dyslexia-game', 'general-form'
];

const ALL_PACKAGES = [
    'autism-essential', 'adhd-core', 'dyslexia-core', 
    'general-neuro-check', 'dual-insight-pack', 'all-inclusive-pack'
];

async function grantTestAccess() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('✅ Connected to MongoDB');

        logger.info(`\n🎯 Processing ${TEST_USERS.length} test users...\n`);

        for (const email of TEST_USERS) {
            logger.info(`📧 Processing ${email}...`);
            
            // Find user
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                logger.warn(`❌ User not found: ${email}`);
                continue;
            }

            // Make user admin (gives full access)
            user.isAdmin = true;
            await user.save();
            logger.info(`✅ Made ${email} admin`);

            // Grant access to all individual assessments
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
                    logger.info(`  ✅ Granted ${assessmentType} access`);
                } else {
                    logger.info(`  ⏭️  ${assessmentType} access already exists`);
                }
            }

            // Grant access to all combo packages
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
                    logger.info(`  ✅ Granted ${packageId} access`);
                } else {
                    logger.info(`  ⏭️  ${packageId} access already exists`);
                }
            }

            logger.info(`✅ Completed processing ${email}\n`);
        }

        logger.info('🎉 All test users have been granted access!');
        logger.info('\n📋 Summary:');
        logger.info(`- ${TEST_USERS.length} users processed`);
        logger.info(`- All users made admin`);
        logger.info(`- Access granted to ${ALL_ASSESSMENTS.length} assessments`);
        logger.info(`- Access granted to ${ALL_PACKAGES.length} packages`);
        
        process.exit(0);
    } catch (error) {
        logger.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
grantTestAccess();
