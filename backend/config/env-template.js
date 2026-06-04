/**
 * CogniKidz Backend Environment Variables Template
 * 
 * This file contains all the required environment variables for the CogniKidz application.
 * Copy this to create your .env file and fill in the actual values.
 */

const requiredEnvVars = {
  // Database Configuration
  MONGODB_URI: 'mongodb://localhost:27017/cognikidz',
  MONGODB_URL: 'mongodb://localhost:27017/cognikidz',

  // Server Configuration
  PORT: '5000',
  NODE_ENV: 'development',

  // JWT Configuration
  JWT_SECRET: 'your_jwt_secret_key_here',

  // Frontend Configuration
  FRONTEND_URL: 'http://localhost:3000',
  CORS_ORIGINS: 'http://localhost:3000,https://cognikidz.com',

  // Email Configuration (Brevo SMTP) - REQUIRED for email functionality
  BREVO_SMTP_HOST: 'smtp-relay.brevo.com',
  BREVO_SMTP_PORT: '587',
  BREVO_SMTP_USER: 'your_brevo_smtp_user@smtp-brevo.com',
  BREVO_API_KEY: 'your_brevo_api_key_here',
  BREVO_FROM_EMAIL: 'no-reply@cognikidz.care',
  EMAIL_FROM: 'no-reply@cognikidz.care',

  // Azure OpenAI Configuration - REQUIRED for AI report generation
  AZURE_OPENAI_API_KEY: 'your_azure_openai_api_key',
  AZURE_OPENAI_ENDPOINT: 'https://your-resource.openai.azure.com/',
  AZURE_DEPLOYMENT_NAME: 'your_deployment_name',

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: 'your_google_client_id',
  GOOGLE_CLIENT_SECRET: 'your_google_client_secret',
  GOOGLE_REDIRECT_URI: 'http://localhost:5000/auth/google/callback',

  // File Upload Configuration (AWS S3)
  AWS_ACCESS_KEY_ID: 'your_aws_access_key',
  AWS_SECRET_ACCESS_KEY: 'your_aws_secret_key',
  AWS_REGION: 'us-east-1',
  AWS_S3_BUCKET_NAME: 'cognikidz-uploads',

  // Alternative: Google Cloud Storage Configuration
  GOOGLE_CLOUD_PROJECT_ID: 'your_project_id',
  GOOGLE_CLOUD_KEYFILE_PATH: 'path/to/your/service-account-key.json',
  GOOGLE_CLOUD_BUCKET_NAME: 'cognikidz-uploads',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',

  // Session Configuration
  SESSION_SECRET: 'your_session_secret_key'
};

// Payment Gateway (Razorpay)
requiredEnvVars.RAZORPAY_KEY_ID = 'your_razorpay_key_id';
requiredEnvVars.RAZORPAY_KEY_SECRET = 'your_razorpay_key_secret';
requiredEnvVars.RAZORPAY_WEBHOOK_SECRET = 'your_razorpay_webhook_secret';


const optionalEnvVars = {
  // Alternative Email Configuration (Gmail)
  GMAIL_USER: 'your_gmail@gmail.com',
  GMAIL_PASS: 'your_gmail_app_password',

  // Alternative Email Configuration (Custom SMTP)
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
  SMTP_USER: 'your_smtp_user',
  SMTP_PASS: 'your_smtp_password',
  SMTP_SECURE: 'false'
};

/**
 * Generate .env file content
 */
function generateEnvContent() {
  let content = '# =================\n';
  content += '# CogniKidz Backend Environment Variables\n';
  content += '# =================\n\n';

  content += '# Database Configuration\n';
  content += `MONGODB_URI=${requiredEnvVars.MONGODB_URI}\n`;
  content += `MONGODB_URL=${requiredEnvVars.MONGODB_URL}\n\n`;

  content += '# Server Configuration\n';
  content += `PORT=${requiredEnvVars.PORT}\n`;
  content += `NODE_ENV=${requiredEnvVars.NODE_ENV}\n\n`;

  content += '# JWT Configuration\n';
  content += `JWT_SECRET=${requiredEnvVars.JWT_SECRET}\n\n`;

  content += '# Frontend Configuration\n';
  content += `FRONTEND_URL=${requiredEnvVars.FRONTEND_URL}\n`;
  content += `CORS_ORIGINS=${requiredEnvVars.CORS_ORIGINS}\n\n`;

  content += '# =================\n';
  content += '# Email Configuration (Brevo SMTP) - REQUIRED\n';
  content += '# =================\n';
  content += `BREVO_SMTP_HOST=${requiredEnvVars.BREVO_SMTP_HOST}\n`;
  content += `BREVO_SMTP_PORT=${requiredEnvVars.BREVO_SMTP_PORT}\n`;
  content += `BREVO_SMTP_USER=${requiredEnvVars.BREVO_SMTP_USER}\n`;
  content += `BREVO_API_KEY=${requiredEnvVars.BREVO_API_KEY}\n`;
  content += `BREVO_FROM_EMAIL=${requiredEnvVars.BREVO_FROM_EMAIL}\n`;
  content += `EMAIL_FROM=${requiredEnvVars.EMAIL_FROM}\n\n`;

  content += '# =================\n';
  content += '# Azure OpenAI Configuration - REQUIRED\n';
  content += '# =================\n';
  content += `AZURE_OPENAI_API_KEY=${requiredEnvVars.AZURE_OPENAI_API_KEY}\n`;
  content += `AZURE_OPENAI_ENDPOINT=${requiredEnvVars.AZURE_OPENAI_ENDPOINT}\n`;
  content += `AZURE_DEPLOYMENT_NAME=${requiredEnvVars.AZURE_DEPLOYMENT_NAME}\n\n`;

  content += '# =================\n';
  content += '# Google OAuth Configuration\n';
  content += '# =================\n';
  content += `GOOGLE_CLIENT_ID=${requiredEnvVars.GOOGLE_CLIENT_ID}\n`;
  content += `GOOGLE_CLIENT_SECRET=${requiredEnvVars.GOOGLE_CLIENT_SECRET}\n`;
  content += `GOOGLE_REDIRECT_URI=${requiredEnvVars.GOOGLE_REDIRECT_URI}\n\n`;

  content += '# =================\n';
  content += '# File Upload Configuration\n';
  content += '# =================\n';
  content += `AWS_ACCESS_KEY_ID=${requiredEnvVars.AWS_ACCESS_KEY_ID}\n`;
  content += `AWS_SECRET_ACCESS_KEY=${requiredEnvVars.AWS_SECRET_ACCESS_KEY}\n`;
  content += `AWS_REGION=${requiredEnvVars.AWS_REGION}\n`;
  content += `AWS_S3_BUCKET_NAME=${requiredEnvVars.AWS_S3_BUCKET_NAME}\n\n`;

  content += '# Other Configuration\n';
  content += `RATE_LIMIT_WINDOW_MS=${requiredEnvVars.RATE_LIMIT_WINDOW_MS}\n`;
  content += `RATE_LIMIT_MAX_REQUESTS=${requiredEnvVars.RATE_LIMIT_MAX_REQUESTS}\n`;
  content += `SESSION_SECRET=${requiredEnvVars.SESSION_SECRET}\n\n`;

  content += '# =================\n';
  content += '# Optional/Alternative Email Configuration\n';
  content += '# =================\n';
  content += `# GMAIL_USER=${optionalEnvVars.GMAIL_USER}\n`;
  content += `# GMAIL_PASS=${optionalEnvVars.GMAIL_PASS}\n`;
  content += `# SMTP_HOST=${optionalEnvVars.SMTP_HOST}\n`;
  content += `# SMTP_PORT=${optionalEnvVars.SMTP_PORT}\n`;
  content += `# SMTP_USER=${optionalEnvVars.SMTP_USER}\n`;
  content += `# SMTP_PASS=${optionalEnvVars.SMTP_PASS}\n`;
  content += `# SMTP_SECURE=${optionalEnvVars.SMTP_SECURE}\n`;

  return content;
}

/**
 * Check missing environment variables
 */
function checkMissingEnvVars() {
  const missing = [];
  const critical = [];

  // Check critical variables for email functionality
  const criticalVars = ['BREVO_SMTP_USER', 'BREVO_API_KEY', 'AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT', 'AZURE_DEPLOYMENT_NAME'];
  
  for (const [key, defaultValue] of Object.entries(requiredEnvVars)) {
    if (!process.env[key]) {
      missing.push(key);
      if (criticalVars.includes(key)) {
        critical.push(key);
      }
    }
  }

  return { missing, critical };
}

/**
 * Get email configuration status
 */
function getEmailConfigStatus() {
  const brevoConfigured = process.env.BREVO_API_KEY && process.env.BREVO_SMTP_USER;
  const gmailConfigured = process.env.GMAIL_USER && process.env.GMAIL_PASS;
  const customSmtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  return {
    brevoConfigured,
    gmailConfigured,
    customSmtpConfigured,
    anyEmailConfigured: brevoConfigured || gmailConfigured || customSmtpConfigured
  };
}

module.exports = {
  requiredEnvVars,
  optionalEnvVars,
  generateEnvContent,
  checkMissingEnvVars,
  getEmailConfigStatus
}; 