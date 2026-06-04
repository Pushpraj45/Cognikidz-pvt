const nodemailer = require("nodemailer");
const logger = require("../../utils/logger");

/**
 * Configure email transporter for Brevo SMTP
 * Production-ready email service configuration
 */
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
    port: parseInt(process.env.BREVO_SMTP_PORT) || 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_API_KEY,
    },
    // Additional security and reliability options
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false, // Allow self-signed certificates in development
    },
    // Connection timeout settings
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
  });
};

/**
 * Send verification email
 * @param {Object} user - User object
 */
const sendVerificationEmail = async (user) => {
  try {
    const transporter = getTransporter();

    // Add timeout for serverless environments
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      transporter.options.connectionTimeout = 30000; // 30 seconds
      transporter.options.greetingTimeout = 30000;
      transporter.options.socketTimeout = 30000;
    }

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${user.verificationToken}`;

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🎉 Welcome to CogniKidz - Verify Your Email</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                min-height: 100vh;
            }
            .email-wrapper {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                position: relative;
            }
            .header {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                padding: 40px 20px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            .header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="60" r="1.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                animation: float 6s ease-in-out infinite;
                opacity: 0.3;
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(180deg); }
            }
            .logo {
                width: 120px;
                height: auto;
                margin-bottom: 20px;
                filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
                position: relative;
                z-index: 2;
            }
            .welcome-title {
                color: #ffffff;
                font-size: 32px;
                font-weight: 800;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                position: relative;
                z-index: 2;
            }
            .welcome-subtitle {
                color: rgba(255, 255, 255, 0.9);
                font-size: 18px;
                font-weight: 400;
                position: relative;
                z-index: 2;
            }
            .content {
                padding: 50px 40px;
                text-align: center;
                background: #ffffff;
            }
            .greeting {
                font-size: 24px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                color: #4a5568;
                margin-bottom: 35px;
                line-height: 1.8;
                max-width: 480px;
                margin-left: auto;
                margin-right: auto;
            }
            .cta-section {
                margin: 40px 0;
            }
            .verify-button {
                display: inline-block;
                padding: 18px 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                text-decoration: none;
                border-radius: 50px;
                font-size: 18px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            .verify-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
                color: #ffffff;
                text-decoration: none;
            }
            .verify-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s;
            }
            .verify-button:hover::before {
                left: 100%;
            }
            .features {
                display: flex;
                justify-content: space-around;
                margin: 40px 0;
                flex-wrap: wrap;
            }
            .feature {
                text-align: center;
                margin: 10px;
                flex: 1;
                min-width: 150px;
            }
            .feature-icon {
                font-size: 40px;
                margin-bottom: 15px;
                display: block;
            }
            .feature-text {
                font-size: 14px;
                color: #718096;
                font-weight: 500;
            }
            .security-note {
                background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
                padding: 20px;
                border-radius: 15px;
                margin: 30px 0;
                border-left: 4px solid #e17055;
            }
            .security-note h4 {
                color: #2d3748;
                margin-bottom: 10px;
                font-size: 16px;
                font-weight: 600;
            }
            .security-note p {
                color: #4a5568;
                font-size: 14px;
                margin: 0;
            }
            .footer {
                background: #f7fafc;
                padding: 30px 40px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            .footer-text {
                color: #718096;
                font-size: 14px;
                margin-bottom: 15px;
            }
            .social-links {
                margin: 20px 0;
            }
            .social-link {
                display: inline-block;
                margin: 0 10px;
                color: #a0aec0;
                font-size: 18px;
                transition: color 0.3s ease;
            }
            .social-link:hover {
                color: #667eea;
            }
            .company-info {
                color: #a0aec0;
                font-size: 12px;
                margin-top: 20px;
            }
            @media (max-width: 600px) {
                .email-wrapper {
                    margin: 0 10px;
                    border-radius: 15px;
                }
                .content {
                    padding: 30px 20px;
                }
                .welcome-title {
                    font-size: 28px;
                }
                .greeting {
                    font-size: 20px;
                }
                .verify-button {
                    padding: 15px 30px;
                    font-size: 16px;
                }
                .features {
                    flex-direction: column;
                }
                .feature {
                    margin: 15px 0;
                }
            }
            /* Animation for entrance */
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .content > * {
                animation: slideInUp 0.6s ease-out forwards;
                animation-delay: 0.2s;
            }
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <!-- Header with Logo and Welcome -->
            <div class="header">
                <img src="/LOGO.png" alt="CogniKidz Logo" class="logo" />
                <h1 class="welcome-title">Welcome to CogniKidz! 🎉</h1>
                <p class="welcome-subtitle">Your journey to cognitive development starts here</p>
            </div>

            <!-- Main Content -->
            <div class="content">
                <h2 class="greeting">Hi ${user.firstName || "there"}!</h2>
                
                <p class="message">
                    🚀 <strong>Exciting news!</strong> You're just one click away from joining thousands of parents and educators who are transforming children's learning experience with CogniKidz.
                    <br><br>
                    To get started with personalized cognitive development activities, interactive learning games, and expert-designed curricula, please verify your email address below:
                </p>

                <div class="cta-section">
                    <a href="${verificationUrl}" class="verify-button">
                        ✨ Verify My Email & Get Started
                    </a>
                </div>

                <!-- Feature Highlights -->
                <div class="features">
                    <div class="feature">
                        <span class="feature-icon">🧠</span>
                        <p class="feature-text">Cognitive Development Activities</p>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">🎮</span>
                        <p class="feature-text">Interactive Learning Games</p>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">📊</span>
                        <p class="feature-text">Progress Tracking</p>
                    </div>
                </div>

                <!-- Security Note -->
                <div class="security-note">
                    <h4>🔒 Security First</h4>
                    <p>This verification link will expire in 24 hours for your security. If you didn't create a CogniKidz account, you can safely ignore this email.</p>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p class="footer-text">
                    <strong>Need help?</strong> Our support team is here for you 24/7.
                    <br>
                    Reply to this email or visit our <a href="${
                      process.env.FRONTEND_URL
                    }/support" style="color: #667eea;">support center</a>.
                </p>
                
                <div class="social-links">
                    <a href="#" class="social-link">📧</a>
                    <a href="#" class="social-link">🐦</a>
                    <a href="#" class="social-link">📘</a>
                    <a href="#" class="social-link">📷</a>
                </div>
                
                <div class="company-info">
                    <p>© 2025 CogniKidz. All rights reserved.</p>
                    <p>Empowering young minds through innovative learning solutions.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: `"CogniKidz" <${
        process.env.EMAIL_FROM || "no-reply@cognikidz.care"
      }>`,
      to: user.email,
      subject: "✅ Verify Your Email - Welcome to CogniKidz!",
      html: htmlTemplate,
      text: `
Welcome to CogniKidz!

Hi ${user.firstName || "there"}!

Thank you for joining CogniKidz! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours for your security.

If you didn't create an account with CogniKidz, please ignore this email.

Best regards,
The CogniKidz Team
      `.trim(),
    });

    logger.info(`Verification email sent to ${user.email}`);
  } catch (error) {
    logger.error("Error sending verification email:", error);

    // Provide more specific error information
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new Error(
        "Email service is currently unavailable. Please try again later."
      );
    } else if (error.code === "ETIMEDOUT") {
      throw new Error("Email service timeout. Please try again.");
    } else if (error.responseCode >= 400 && error.responseCode < 500) {
      throw new Error("Email configuration error. Please contact support.");
    }

    throw new Error("Failed to send verification email");
  }
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {String} token - Reset token
 */
const sendPasswordResetEmail = async (user, token) => {
  try {
    const transporter = getTransporter();

    // Add timeout for serverless environments
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      transporter.options.connectionTimeout = 30000; // 30 seconds
      transporter.options.greetingTimeout = 30000;
      transporter.options.socketTimeout = 30000;
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🔐 Reset Your CogniKidz Password</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                min-height: 100vh;
            }
            .email-wrapper {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                position: relative;
            }
            .header {
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                padding: 40px 20px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            .header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="60" r="1.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                animation: float 6s ease-in-out infinite;
                opacity: 0.3;
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(180deg); }
            }
            .logo {
                width: 120px;
                height: auto;
                margin-bottom: 20px;
                filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
                position: relative;
                z-index: 2;
            }
            .security-title {
                color: #ffffff;
                font-size: 32px;
                font-weight: 800;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                position: relative;
                z-index: 2;
            }
            .security-subtitle {
                color: rgba(255, 255, 255, 0.9);
                font-size: 18px;
                font-weight: 400;
                position: relative;
                z-index: 2;
            }
            .content {
                padding: 50px 40px;
                text-align: center;
                background: #ffffff;
            }
            .greeting {
                font-size: 24px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                color: #4a5568;
                margin-bottom: 35px;
                line-height: 1.8;
                max-width: 480px;
                margin-left: auto;
                margin-right: auto;
            }
            .cta-section {
                margin: 40px 0;
            }
            .reset-button {
                display: inline-block;
                padding: 18px 40px;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                color: #ffffff;
                text-decoration: none;
                border-radius: 50px;
                font-size: 18px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 10px 30px rgba(255, 107, 107, 0.4);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            .reset-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 40px rgba(255, 107, 107, 0.6);
                color: #ffffff;
                text-decoration: none;
            }
            .reset-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s;
            }
            .reset-button:hover::before {
                left: 100%;
            }
            .security-tips {
                display: flex;
                justify-content: space-around;
                margin: 40px 0;
                flex-wrap: wrap;
            }
            .tip {
                text-align: center;
                margin: 10px;
                flex: 1;
                min-width: 150px;
            }
            .tip-icon {
                font-size: 40px;
                margin-bottom: 15px;
                display: block;
            }
            .tip-text {
                font-size: 14px;
                color: #718096;
                font-weight: 500;
            }
            .security-note {
                background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
                padding: 20px;
                border-radius: 15px;
                margin: 30px 0;
                border-left: 4px solid #e17055;
            }
            .security-note h4 {
                color: #2d3748;
                margin-bottom: 10px;
                font-size: 16px;
                font-weight: 600;
            }
            .security-note p {
                color: #4a5568;
                font-size: 14px;
                margin: 0;
            }
            .footer {
                background: #f7fafc;
                padding: 30px 40px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            .footer-text {
                color: #718096;
                font-size: 14px;
                margin-bottom: 15px;
            }
            .social-links {
                margin: 20px 0;
            }
            .social-link {
                display: inline-block;
                margin: 0 10px;
                color: #a0aec0;
                font-size: 18px;
                transition: color 0.3s ease;
            }
            .social-link:hover {
                color: #ff6b6b;
            }
            .company-info {
                color: #a0aec0;
                font-size: 12px;
                margin-top: 20px;
            }
            @media (max-width: 600px) {
                .email-wrapper {
                    margin: 0 10px;
                    border-radius: 15px;
                }
                .content {
                    padding: 30px 20px;
                }
                .security-title {
                    font-size: 28px;
                }
                .greeting {
                    font-size: 20px;
                }
                .reset-button {
                    padding: 15px 30px;
                    font-size: 16px;
                }
                .security-tips {
                    flex-direction: column;
                }
                .tip {
                    margin: 15px 0;
                }
            }
            /* Animation for entrance */
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .content > * {
                animation: slideInUp 0.6s ease-out forwards;
                animation-delay: 0.2s;
            }
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <!-- Header with Logo and Security Message -->
            <div class="header">
                <img src="/LOGO.png" alt="CogniKidz Logo" class="logo" />
                <h1 class="security-title">Password Reset Request 🔐</h1>
                <p class="security-subtitle">We're here to help you regain access to your account</p>
            </div>

            <!-- Main Content -->
            <div class="content">
                <h2 class="greeting">Hi ${user.firstName || "there"}!</h2>
                
                <p class="message">
                    🔒 We received a request to reset your CogniKidz account password. No worries - it happens to the best of us!
                    <br><br>
                    If you made this request, simply click the button below to create a new, secure password for your account:
                </p>

                <div class="cta-section">
                    <a href="${resetUrl}" class="reset-button">
                        🔑 Reset My Password
                    </a>
                </div>

                <!-- Security Tips -->
                <div class="security-tips">
                    <div class="tip">
                        <span class="tip-icon">⏰</span>
                        <p class="tip-text">Link expires in 1 hour</p>
                    </div>
                    <div class="tip">
                        <span class="tip-icon">🔒</span>
                        <p class="tip-text">Secure & encrypted</p>
                    </div>
                    <div class="tip">
                        <span class="tip-icon">🛡️</span>
                        <p class="tip-text">Safe & protected</p>
                    </div>
                </div>

                <!-- Security Note -->
                <div class="security-note">
                    <h4>🚨 Important Security Information</h4>
                    <p>
                        If you didn't request this password reset, please ignore this email or contact our support team immediately. 
                        Your current password remains unchanged until you create a new one.
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p class="footer-text">
                    <strong>Need help?</strong> Our security team is available 24/7.
                    <br>
                    Contact us at <a href="mailto:security@cognikidz.care" style="color: #ff6b6b;">security@cognikidz.care</a>
                </p>
                
                <div class="social-links">
                    <a href="#" class="social-link">📧</a>
                    <a href="#" class="social-link">🐦</a>
                    <a href="#" class="social-link">📘</a>
                    <a href="#" class="social-link">📷</a>
                </div>
                
                <div class="company-info">
                    <p>© 2025 CogniKidz Security Team. All rights reserved.</p>
                    <p>Keeping your account safe and secure.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: `"CogniKidz Security" <${
        process.env.EMAIL_FROM || "no-reply@cognikidz.care"
      }>`,
      to: user.email,
      subject: "🔐 Reset Your CogniKidz Password",
      html: htmlTemplate,
      text: `
Password Reset Request - CogniKidz

Hi ${user.firstName || "there"}!

We received a request to reset your CogniKidz account password. If you made this request, click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour for your security.

If you didn't request a password reset, please ignore this email or contact support if you have concerns.

Security Tip: Never share your password reset link with anyone. CogniKidz will never ask for your password via email.

Best regards,
The CogniKidz Security Team
      `.trim(),
    });

    logger.info(`Password reset email sent to ${user.email}`);
  } catch (error) {
    logger.error("Error sending password reset email:", error);

    // Provide more specific error information
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new Error(
        "Email service is currently unavailable. Please try again later."
      );
    } else if (error.code === "ETIMEDOUT") {
      throw new Error("Email service timeout. Please try again.");
    } else if (error.responseCode >= 400 && error.responseCode < 500) {
      throw new Error("Email configuration error. Please contact support.");
    }

    throw new Error("Failed to send password reset email");
  }
};

/**
 * Send password changed confirmation email
 * @param {Object} user - User object
 */
const sendPasswordChangedEmail = async (user) => {
  try {
    const transporter = getTransporter();

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>✅ Your CogniKidz Password Has Been Updated</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                min-height: 100vh;
            }
            .email-wrapper {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                position: relative;
            }
            .header {
                background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
                padding: 40px 20px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            .header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="60" r="1.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                animation: float 6s ease-in-out infinite;
                opacity: 0.3;
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(180deg); }
            }
            .logo {
                width: 120px;
                height: auto;
                margin-bottom: 20px;
                filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
                position: relative;
                z-index: 2;
            }
            .success-title {
                color: #ffffff;
                font-size: 32px;
                font-weight: 800;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                position: relative;
                z-index: 2;
            }
            .success-subtitle {
                color: rgba(255, 255, 255, 0.9);
                font-size: 18px;
                font-weight: 400;
                position: relative;
                z-index: 2;
            }
            .content {
                padding: 50px 40px;
                text-align: center;
                background: #ffffff;
            }
            .greeting {
                font-size: 24px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 20px;
            }
            .success-icon {
                font-size: 80px;
                margin-bottom: 30px;
                display: block;
                animation: bounce 2s infinite;
            }
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
            .message {
                font-size: 16px;
                color: #4a5568;
                margin-bottom: 35px;
                line-height: 1.8;
                max-width: 480px;
                margin-left: auto;
                margin-right: auto;
            }
            .security-features {
                display: flex;
                justify-content: space-around;
                margin: 40px 0;
                flex-wrap: wrap;
            }
            .feature {
                text-align: center;
                margin: 10px;
                flex: 1;
                min-width: 150px;
            }
            .feature-icon {
                font-size: 40px;
                margin-bottom: 15px;
                display: block;
            }
            .feature-text {
                font-size: 14px;
                color: #718096;
                font-weight: 500;
            }
            .confirmation-box {
                background: linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%);
                padding: 25px;
                border-radius: 15px;
                margin: 30px 0;
                border-left: 4px solid #00b894;
                text-align: left;
            }
            .confirmation-box h4 {
                color: #2d3748;
                margin-bottom: 15px;
                font-size: 18px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .confirmation-box p {
                color: #4a5568;
                font-size: 15px;
                margin-bottom: 10px;
                line-height: 1.6;
            }
            .timestamp {
                background: #f7fafc;
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                border: 1px solid #e2e8f0;
            }
            .timestamp p {
                color: #718096;
                font-size: 14px;
                margin: 0;
            }
            .help-section {
                background: linear-gradient(135deg, #ffe8d6 0%, #ffeaa7 100%);
                padding: 20px;
                border-radius: 15px;
                margin: 30px 0;
                border-left: 4px solid #fdcb6e;
            }
            .help-section h4 {
                color: #2d3748;
                margin-bottom: 10px;
                font-size: 16px;
                font-weight: 600;
            }
            .help-section p {
                color: #4a5568;
                font-size: 14px;
                margin: 0;
            }
            .footer {
                background: #f7fafc;
                padding: 30px 40px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            .footer-text {
                color: #718096;
                font-size: 14px;
                margin-bottom: 15px;
            }
            .social-links {
                margin: 20px 0;
            }
            .social-link {
                display: inline-block;
                margin: 0 10px;
                color: #a0aec0;
                font-size: 18px;
                transition: color 0.3s ease;
            }
            .social-link:hover {
                color: #00b894;
            }
            .company-info {
                color: #a0aec0;
                font-size: 12px;
                margin-top: 20px;
            }
            @media (max-width: 600px) {
                .email-wrapper {
                    margin: 0 10px;
                    border-radius: 15px;
                }
                .content {
                    padding: 30px 20px;
                }
                .success-title {
                    font-size: 28px;
                }
                .greeting {
                    font-size: 20px;
                }
                .success-icon {
                    font-size: 60px;
                }
                .security-features {
                    flex-direction: column;
                }
                .feature {
                    margin: 15px 0;
                }
                .confirmation-box {
                    padding: 20px;
                }
            }
            /* Animation for entrance */
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .content > * {
                animation: slideInUp 0.6s ease-out forwards;
                animation-delay: 0.2s;
            }
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <!-- Header with Logo and Success Message -->
            <div class="header">
                <img src="/LOGO.png" alt="CogniKidz Logo" class="logo" />
                <h1 class="success-title">Password Updated Successfully! ✅</h1>
                <p class="success-subtitle">Your account security has been enhanced</p>
            </div>

            <!-- Main Content -->
            <div class="content">
                <h2 class="greeting">Hi ${user.firstName || "there"}! 👋</h2>
                
                <span class="success-icon">🎉</span>
                
                <p class="message">
                    <strong>Great news!</strong> Your CogniKidz account password has been successfully updated and your account is now more secure than ever.
                    <br><br>
                    This confirmation ensures that you're always informed about important changes to your account security.
                </p>

                <!-- Security Features -->
                <div class="security-features">
                    <div class="feature">
                        <span class="feature-icon">🔐</span>
                        <p class="feature-text">Enhanced Security</p>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">✅</span>
                        <p class="feature-text">Instant Confirmation</p>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">🛡️</span>
                        <p class="feature-text">Protected Account</p>
                    </div>
                </div>

                <!-- Confirmation Details -->
                <div class="confirmation-box">
                    <h4>🔒 Password Change Confirmation</h4>
                    <p>✓ Your password has been successfully updated</p>
                    <p>✓ All active sessions have been secured</p>
                    <p>✓ Your account remains fully protected</p>
                </div>

                <!-- Timestamp -->
                <div class="timestamp">
                    <p><strong>Changed on:</strong> ${new Date().toLocaleString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZoneName: "short",
                      }
                    )}</p>
                </div>

                <!-- Help Section -->
                <div class="help-section">
                    <h4>🚨 Didn't Make This Change?</h4>
                    <p>
                        If you didn't request this password change, please contact our security team immediately at 
                        <strong>security@cognikidz.care</strong> or through our support center. We take account security very seriously.
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p class="footer-text">
                    <strong>Security Questions?</strong> Our team is here to help 24/7.
                    <br>
                    Email us at <a href="mailto:security@cognikidz.care" style="color: #00b894;">security@cognikidz.care</a>
                </p>
                
                <div class="social-links">
                    <a href="#" class="social-link">📧</a>
                    <a href="#" class="social-link">🐦</a>
                    <a href="#" class="social-link">📘</a>
                    <a href="#" class="social-link">📷</a>
                </div>
                
                <div class="company-info">
                    <p>© 2025 CogniKidz Security Team. All rights reserved.</p>
                    <p>Committed to keeping your account safe and secure.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: `"CogniKidz Security" <${
        process.env.EMAIL_FROM || "no-reply@cognikidz.care"
      }>`,
      to: user.email,
      subject: "✅ Your CogniKidz Password Has Been Successfully Updated",
      html: htmlTemplate,
      text: `
Password Changed - CogniKidz

Hi ${user.firstName || "there"}!

This is a confirmation that the password for your CogniKidz account has just been changed.

If you did not request this change, please contact support immediately.

Best regards,
The CogniKidz Security Team
      `.trim(),
    });

    logger.info(`Password changed confirmation email sent to ${user.email}`);
  } catch (error) {
    logger.error("Error sending password changed email:", error);
    throw new Error("Failed to send password changed email");
  }
};

/**
 * Send welcome email (for Google OAuth users)
 * @param {Object} user - User object
 */
const sendWelcomeEmail = async (user) => {
  try {
    const transporter = getTransporter();

    // Add timeout for serverless environments
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      transporter.options.connectionTimeout = 30000; // 30 seconds
      transporter.options.greetingTimeout = 30000;
      transporter.options.socketTimeout = 30000;
    }

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🎉 Welcome to CogniKidz!</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1E293B;
                background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 50%, #F5F3FF 100%);
                padding: 20px;
                min-height: 100vh;
            }
            .email-wrapper {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                position: relative;
            }
            .header {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                padding: 40px 20px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            .header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="60" r="1.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                animation: float 6s ease-in-out infinite;
                opacity: 0.3;
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(180deg); }
            }
            .logo {
                width: 120px;
                height: auto;
                margin-bottom: 20px;
                filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
                position: relative;
                z-index: 2;
            }
            .welcome-title {
                color: #ffffff;
                font-size: 32px;
                font-weight: 800;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                position: relative;
                z-index: 2;
            }
            .welcome-subtitle {
                color: rgba(255, 255, 255, 0.9);
                font-size: 18px;
                font-weight: 400;
                position: relative;
                z-index: 2;
            }
            .content {
                padding: 50px 40px;
                text-align: center;
                background: #ffffff;
            }
            .greeting {
                font-size: 24px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                color: #4a5568;
                margin-bottom: 35px;
                line-height: 1.8;
                max-width: 480px;
                margin-left: auto;
                margin-right: auto;
            }
            .features {
                display: flex;
                justify-content: space-around;
                margin: 40px 0;
                flex-wrap: wrap;
            }
            .feature {
                text-align: center;
                margin: 10px;
                flex: 1;
                min-width: 150px;
            }
            .feature-icon {
                font-size: 40px;
                margin-bottom: 15px;
                display: block;
            }
            .feature-text {
                font-size: 14px;
                color: #718096;
                font-weight: 500;
            }
            .footer {
                background: #f7fafc;
                padding: 30px 40px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            .footer-text {
                color: #718096;
                font-size: 14px;
                margin-bottom: 15px;
            }
            .social-links {
                margin: 20px 0;
            }
            .social-link {
                display: inline-block;
                margin: 0 10px;
                color: #a0aec0;
                font-size: 18px;
                transition: color 0.3s ease;
            }
            .social-link:hover {
                color: #667eea;
            }
            .company-info {
                color: #a0aec0;
                font-size: 12px;
                margin-top: 20px;
            }
            @media (max-width: 600px) {
                .email-wrapper {
                    margin: 0 10px;
                    border-radius: 15px;
                }
                .content {
                    padding: 30px 20px;
                }
                .welcome-title {
                    font-size: 28px;
                }
                .greeting {
                    font-size: 20px;
                }
                .features {
                    flex-direction: column;
                }
                .feature {
                    margin: 15px 0;
                }
            }
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .content > * {
                animation: slideInUp 0.6s ease-out forwards;
                animation-delay: 0.2s;
            }
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <!-- Header with Logo and Welcome -->
            <div class="header">
                <img src="/LOGO.png" alt="CogniKidz Logo" class="logo" />
                <h1 class="welcome-title">Welcome to CogniKidz! 🎉</h1>
                <p class="welcome-subtitle">Your journey to cognitive development starts here</p>
            </div>

            <!-- Main Content -->
            <div class="content">
                <h2 class="greeting">Hi ${user.firstName || "there"}!</h2>
                <p class="message">
                    🎉 <strong>Welcome to CogniKidz!</strong> You're now part of a community dedicated to unlocking every child's potential through innovative cognitive development tools.
                    <br><br>
                    Your account is ready! Start exploring personalized assessments, track your child's progress, and discover insights that will guide their learning journey.
                </p>

                <div style="text-align: center; margin: 40px 0;">
                    <a href="${process.env.FRONTEND_URL || "https://cognikidz.care"}/dashboard" 
                       style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: #ffffff !important; text-decoration: none !important; border-radius: 25px; font-size: 18px; font-weight: 600; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.3); transition: all 0.3s ease;">
                        🚀 Explore Your Dashboard
                    </a>
                </div>

                <!-- Next Steps -->
                <div style="background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%); padding: 30px; border-radius: 16px; margin: 30px 0; border-left: 4px solid #6366F1; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <h3 style="color: #1E293B; margin-bottom: 20px; font-size: 20px; font-weight: 600;">🎯 What's Next?</h3>
                    <div style="text-align: left;">
                        <div style="margin-bottom: 15px; display: flex; align-items: flex-start;">
                            <span style="color: #6366F1; font-size: 18px; margin-right: 12px; margin-top: 2px;">1️⃣</span>
                            <div>
                                <strong style="color: #1E293B;">Add Your Child's Profile</strong>
                                <p style="color: #64748B; margin: 5px 0 0 0; font-size: 14px;">Create a profile to get personalized assessments and recommendations</p>
                            </div>
                        </div>
                        <div style="margin-bottom: 15px; display: flex; align-items: flex-start;">
                            <span style="color: #6366F1; font-size: 18px; margin-right: 12px; margin-top: 2px;">2️⃣</span>
                            <div>
                                <strong style="color: #1E293B;">Take Your First Assessment</strong>
                                <p style="color: #64748B; margin: 5px 0 0 0; font-size: 14px;">Start with our comprehensive assessment to understand your child's strengths</p>
                            </div>
                        </div>
                        <div style="display: flex; align-items: flex-start;">
                            <span style="color: #6366F1; font-size: 18px; margin-right: 12px; margin-top: 2px;">3️⃣</span>
                            <div>
                                <strong style="color: #1E293B;">Track Progress & Growth</strong>
                                <p style="color: #64748B; margin: 5px 0 0 0; font-size: 14px;">Monitor development and celebrate milestones along the way</p>
                            </div>
                        </div>
                    </div>
                </div>


            </div>

            <!-- Footer -->
            <div class="footer">
                <p class="footer-text">
                    <strong>Need help?</strong> Our support team is here for you 24/7.
                    <br>
                    Reply to this email or visit our <a href="${
                      process.env.FRONTEND_URL
                    }/support" style="color: #667eea;">support center</a>.
                </p>
                <div class="social-links">
                    <a href="#" class="social-link">📧</a>
                    <a href="#" class="social-link">🐦</a>
                    <a href="#" class="social-link">📘</a>
                    <a href="#" class="social-link">📷</a>
                </div>
                <div class="company-info">
                    <p>© 2025 CogniKidz. All rights reserved.</p>
                    <p>Empowering young minds through innovative learning solutions.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: `"CogniKidz" <${
        process.env.EMAIL_FROM || "no-reply@cognikidz.care"
      }>`,
      to: user.email,
      subject: "🎉 Welcome to CogniKidz!",
      html: htmlTemplate,
      text: `
Welcome to CogniKidz!

Hi ${user.firstName || "there"}!

Thank you for joining CogniKidz! You're now part of our family. Get started with personalized activities, games, and more by logging in to your dashboard.

If you didn't create an account with CogniKidz, please ignore this email.

Best regards,
The CogniKidz Team
      `.trim(),
    });

    logger.info(`Welcome email sent to ${user.email}`);
  } catch (error) {
    logger.error("Error sending welcome email:", error);
    // Provide more specific error information
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new Error(
        "Email service is currently unavailable. Please try again later."
      );
    } else if (error.code === "ETIMEDOUT") {
      throw new Error("Email service timeout. Please try again.");
    } else if (error.responseCode >= 400 && error.responseCode < 500) {
      throw new Error("Email configuration error. Please contact support.");
    }
    throw new Error("Failed to send welcome email");
  }
};

/**
 * Verify token format and expiration
 * @param {String} token - JWT token
 * @returns {Boolean} - Valid or not
 */
const verifyToken = (token) => {
  try {
    if (!token) return false;

    // Basic JWT format check (3 parts separated by dots)
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Try to decode the payload
    const payload = JSON.parse(atob(parts[1]));

    // Check if token has expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  verifyToken,
  sendWelcomeEmail,
};
