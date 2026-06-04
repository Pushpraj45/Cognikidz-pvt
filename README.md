# CogniKidz User Guide
*Early Detection Tools for Children's Developmental Assessment*

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Account Management](#account-management)
3. [Child Profile Management](#child-profile-management)
4. [Assessment Types & Process](#assessment-types--process)
5. [Understanding Reports](#understanding-reports)
6. [Dashboard Navigation](#dashboard-navigation)
7. [Blog & Community](#blog--community)
8. [Support & Contact](#support--contact)
9. [Troubleshooting](#troubleshooting)
10. [Frequently Asked Questions](#frequently-asked-questions)

---

## 🚀 Getting Started

### What is CogniKidz?

CogniKidz is a comprehensive digital platform designed to help parents and caregivers identify early signs of developmental conditions in children, including:

- **ADHD** (Attention Deficit Hyperactivity Disorder)
- **Autism Spectrum Disorder**
- **Dyslexia** and Learning Disabilities
- **General Developmental Assessments**

### System Requirements

- **Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Internet Connection**: Stable broadband connection recommended
- **Device**: Desktop, tablet, or mobile device
- **JavaScript**: Must be enabled

### Quick Start Checklist

✅ Create your account  
✅ Verify your email address  
✅ Add your child's profile  
✅ Take your first assessment  
✅ Review results and recommendations  

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Features

- **Multimedia Assessments**: Interactive image-based assessments for Autism, ADHD, and Dyslexia
- **AI-Powered Reports**: Detailed analysis using Azure OpenAI
- **Child Profiles**: Comprehensive child management system
- **Secure Authentication**: Google OAuth integration
- **Cloud Storage**: AWS S3 integration for image storage
- **Multi-language Support**: Translation services

## Assessment Types

1. **Autism Assessment**: Visual preference analysis for social attention patterns
2. **ADHD Assessment**: Attention and impulse control evaluation
3. **Dyslexia Assessment**: Reading and language processing evaluation

## Recent Fixes (June 2025)

### Image-Based Assessment Improvements
- **Fixed Duplicate Exit Buttons**: Removed redundant exit button, now shows only one in the assessment header
- **Enhanced Image Layout**: Added fixed aspect ratio (4:3) to prevent layout shifts with different image sizes
- **Improved Report Generation**: Fixed AI report generation to properly call backend API after assessment completion
- **Better Image Set Randomization**: Improved algorithm to prevent duplicate image sets by using random field sorting instead of $sample
- **Assessment Type Handling**: Ensured proper conversion from frontend (`autism-multimedia`) to backend (`autism`) format

### Technical Details
- Modified `MultimediaAssessmentSession.js` to remove duplicate exit button
- Updated `MultimediaAssessmentQuiz.js` with `aspect-[4/3]` class for consistent image dimensions
- Enhanced `handleAssessmentComplete` function to properly generate AI reports
- Improved `getRandomImageSets` method in backend service for better randomization
- Added comprehensive error handling and fallback report generation

These fixes ensure a smoother assessment experience with proper report generation and consistent UI layout.

---

## 👤 Account Management

### Creating Your Account

1. **Visit the Platform**: Navigate to the CogniKidz website
2. **Sign Up**: Click "Sign Up" and choose your preferred method:
   - **Email Registration**: Enter email, password, and basic information
   - **Google OAuth**: Sign up instantly with your Google account
3. **Email Verification**: Check your inbox and verify your email address
4. **Profile Setup**: Complete your parent/caregiver profile

### Account Security

- **Strong Passwords**: Use at least 8 characters with mixed case, numbers, and symbols
- **Regular Updates**: Keep your contact information current
- **Privacy Settings**: Review and adjust your privacy preferences
- **Data Protection**: Your information is encrypted and HIPAA-compliant

### Managing Your Profile

#### Updating Personal Information
- Navigate to **Profile Settings**
- Edit contact details, preferences, and notifications
- Upload a profile picture (optional)

#### Password Management
- Use "Change Password" in settings
- For forgotten passwords, use "Forgot Password" on login page
- Password reset links expire after 24 hours

---

## 👶 Child Profile Management

### Adding a New Child Profile

1. **Access Child Management**
   - From Dashboard → "Add Child Profile"
   - Or use the floating "+" button

2. **Basic Information**
   - **Name**: Child's full name
   - **Date of Birth**: Used for age-appropriate assessments
   - **Gender**: Optional, helps with assessment customization
   - **Avatar**: Choose from available options or upload photo

3. **Additional Details**
   - **Current Concerns**: Select relevant developmental concerns
   - **Medical History**: Optional but helpful for context
   - **Educational Information**: School grade, special needs services
   - **Family History**: Relevant developmental or learning conditions

### Managing Multiple Children

- **Family Dashboard**: View all children at once
- **Individual Profiles**: Switch between children easily
- **Separate Assessments**: Each child has independent assessment history
- **Comparison Tools**: Compare progress across siblings (optional)

### Profile Privacy & Security

- **Data Encryption**: All profile data is encrypted
- **Access Control**: Only authorized parents/caregivers can access
- **Sharing Options**: Control who can view assessment results
- **Data Retention**: Understand how long data is stored

---

## 📝 Assessment Types & Process

### Available Assessment Types

#### 1. **ADHD Assessment**
- **Duration**: 15-25 minutes
- **Age Range**: 4-17 years
- **Covers**: Attention, hyperactivity, impulsivity patterns
- **Format**: Parent/caregiver questionnaire with behavioral observations

#### 2. **Autism Spectrum Assessment**
- **Duration**: 20-30 minutes
- **Age Range**: 2-17 years
- **Covers**: Social communication, repetitive behaviors, sensory processing
- **Format**: Developmental milestone and behavioral assessment

#### 3. **Dyslexia Screening**
- **Duration**: 15-20 minutes
- **Age Range**: 5-17 years
- **Covers**: Reading, writing, phonological awareness
- **Format**: Academic performance and skill-based questions

#### 4. **General Developmental Assessment**
- **Duration**: 10-15 minutes
- **Age Range**: 2-17 years
- **Covers**: Overall developmental milestones
- **Format**: Comprehensive screening across multiple domains

### Taking an Assessment

#### Pre-Assessment Preparation

1. **Choose Optimal Time**
   - When you have 20-30 minutes uninterrupted
   - When you can observe your child's typical behavior
   - Avoid times when child is tired or stressed

2. **Gather Information**
   - Recent report cards or teacher feedback
   - Any previous evaluations or assessments
   - Notes about specific concerns or behaviors

#### During the Assessment

1. **Start Assessment**
   - Select child profile
   - Choose assessment type
   - Read consent and privacy notices

2. **Answer Questions**
   - **Be Honest**: Accurate responses lead to better insights
   - **Consider Timeframe**: Most questions ask about recent 6 months
   - **Use Examples**: Think of specific situations when responding
   - **Skip if Unsure**: It's better to skip than guess incorrectly

3. **Assessment Features**
   - **Progress Tracking**: See how much is completed
   - **Save & Resume**: Pause anytime and continue later
   - **Help Text**: Click "?" for clarification on questions
   - **Multiple Choice**: Most questions offer scaled responses

#### Assessment Navigation

- **Previous Question**: Review and change previous answers
- **Next Question**: Move forward when ready
- **Pause Assessment**: Save progress and resume later
- **Exit Assessment**: Leave assessment (progress saved automatically)

### Understanding Assessment Questions

#### Question Types

1. **Frequency Questions**
   - "How often does your child...?"
   - Scale: Never → Rarely → Sometimes → Often → Very Often

2. **Severity Questions**
   - "How severe is this behavior...?"
   - Scale: Not at all → Mild → Moderate → Severe → Very Severe

3. **Comparison Questions**
   - "Compared to other children the same age..."
   - Scale: Much less → Less → About the same → More → Much more

4. **Yes/No Questions**
   - Direct behavioral observations
   - Clear presence or absence of behaviors

#### Best Practices for Accurate Responses

- **Recent Observations**: Focus on the last 6 months
- **Multiple Settings**: Consider behavior at home, school, and social situations
- **Consistency**: Look for patterns rather than isolated incidents
- **Context Matters**: Consider your child's environment and circumstances

---

## 📊 Understanding Reports

### Report Components

#### Risk Assessment Score
- **Scale**: 1-10 (1 = Low Risk, 10 = High Risk)
- **Color Coding**: Green (Low), Yellow (Moderate), Red (High)
- **Interpretation**: Higher scores suggest greater likelihood of condition

#### Domain Analysis
Different assessments analyze specific domains:

**ADHD Domains:**
- Inattention
- Hyperactivity
- Impulsivity

**Autism Domains:**
- Social Communication
- Restricted/Repetitive Behaviors
- Sensory Processing

**Dyslexia Domains:**
- Phonological Awareness
- Reading Fluency
- Written Expression

#### Detailed Analysis
- **Strengths**: Areas where your child shows typical development
- **Concerns**: Areas that may need attention or support
- **Recommendations**: Specific next steps and interventions

### Interpreting Results

#### Low Risk (Scores 1-3)
- **Meaning**: Minimal indicators of the assessed condition
- **Action**: Continue monitoring typical development
- **Follow-up**: Routine developmental check-ups

#### Moderate Risk (Scores 4-6)
- **Meaning**: Some indicators present, warrants monitoring
- **Action**: Discuss with pediatrician or school counselor
- **Follow-up**: Consider re-assessment in 6 months

#### High Risk (Scores 7-10)
- **Meaning**: Multiple indicators suggest professional evaluation needed
- **Action**: Consult with developmental specialist or psychologist
- **Follow-up**: Pursue comprehensive professional assessment

### Using Report Data

#### Sharing with Professionals
- **Download PDF**: Professional-quality reports for sharing
- **Key Talking Points**: Highlighted areas for discussion
- **Historical Data**: Show progress over time

#### Educational Planning
- **School Discussions**: Use results to inform IEP/504 planning
- **Intervention Planning**: Target specific areas of need
- **Progress Monitoring**: Track improvement over time

---

## 🎯 Dashboard Navigation

### Dashboard Overview

The dashboard provides a comprehensive view of your child's assessment journey:

#### Main Sections

1. **Quick Stats**
   - Total assessments completed
   - Recent activity summary
   - Upcoming recommendations

2. **Children Overview**
   - All registered children
   - Recent assessment status
   - Quick action buttons

3. **Recent Assessments**
   - Latest completed assessments
   - Status of in-progress assessments
   - Results summaries

4. **Progress Timeline**
   - Visual representation of assessment history
   - Trend analysis over time
   - Milestone achievements

### Navigation Features

#### Child Selection
- **Multi-Child Families**: Switch between children easily
- **Quick Actions**: Start new assessment, view reports, edit profile
- **Status Indicators**: Visual cues for assessment completeness

#### Assessment History
- **Chronological View**: See all assessments in order
- **Filter Options**: By date, type, or status
- **Comparison Tools**: Compare results across time

#### Reports Management
- **Download Center**: Access all reports in one place
- **Sharing Options**: Email reports to professionals
- **Print Functionality**: Physical copies for appointments

### Dashboard Customization

#### Preferences
- **Notification Settings**: Control email and app notifications
- **Display Options**: Choose what information to highlight
- **Privacy Controls**: Manage data sharing and visibility

#### Mobile Experience
- **Responsive Design**: Optimized for all device sizes
- **Touch Navigation**: Easy interaction on mobile devices
- **Offline Access**: View previously loaded reports offline

---

## 📝 Blog & Community

### Educational Resources

#### Expert Articles
- **Latest Research**: Updates on developmental conditions
- **Parenting Tips**: Practical advice for supporting your child
- **Professional Insights**: Articles from specialists and educators

#### Community Features
- **Comment System**: Engage with other parents and experts
- **Article Sharing**: Share helpful resources
- **Expert Q&A**: Submit questions for professional response

### Content Categories

1. **ADHD Resources**
   - Management strategies
   - Educational accommodations
   - Behavior modification techniques

2. **Autism Support**
   - Communication strategies
   - Sensory processing support
   - Social skills development

3. **Dyslexia Information**
   - Reading intervention methods
   - Educational technology tools
   - Academic accommodation strategies

4. **General Development**
   - Milestone tracking
   - Early intervention benefits
   - Family support strategies

---

## 🆘 Support & Contact

### Getting Help

#### In-App Support
- **Help Center**: Searchable knowledge base
- **Live Chat**: Real-time assistance during business hours
- **Video Tutorials**: Step-by-step guidance for platform features

#### Contact Methods

**Technical Support**
- **Email**: support@cognikidz.com
- **Response Time**: Within 24 hours
- **Available**: Monday-Friday, 9 AM - 6 PM EST

**Clinical Questions**
- **Email**: clinical@cognikidz.com
- **Response Time**: Within 48 hours
- **Available**: Monday-Friday, 8 AM - 5 PM EST

**General Inquiries**
- **Email**: info@cognikidz.com
- **Response Time**: Within 24 hours

#### Emergency Resources
If your child is in immediate danger or crisis:
- **Call 911** (Emergency)
- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741

### Professional Referrals

#### Finding Specialists
- **Psychologists**: Comprehensive developmental evaluations
- **Psychiatrists**: Medication management and diagnosis
- **Educational Specialists**: Learning disability assessments
- **Speech Therapists**: Communication and language support

#### Insurance and Costs
- **Insurance Coverage**: Understanding benefits for assessments
- **Cost Estimates**: Typical ranges for professional evaluations
- **Financial Assistance**: Resources for families needing support

---

## 🔧 Troubleshooting

### Common Issues

#### Login Problems
**Forgot Password**
1. Click "Forgot Password" on login page
2. Enter your email address
3. Check email for reset link (check spam folder)
4. Follow link to create new password

**Account Locked**
- Too many failed login attempts
- Wait 15 minutes before trying again
- Contact support if problem persists

**Google OAuth Issues**
- Clear browser cache and cookies
- Ensure pop-ups are allowed
- Try a different browser

#### Assessment Issues

**Cannot Resume Assessment**
1. Check internet connection
2. Clear browser cache
3. Log out and log back in
4. Contact support if session lost

**Questions Not Loading**
1. Refresh the page
2. Check internet connection
3. Try a different browser
4. Disable browser extensions temporarily

**Progress Not Saving**
1. Ensure stable internet connection
2. Don't use browser back button
3. Use in-app navigation only
4. Save progress frequently

#### Report Access Problems

**Reports Not Generating**
1. Wait 2-3 minutes after assessment completion
2. Refresh the dashboard
3. Check completed assessments section
4. Contact support if report missing after 24 hours

**PDF Download Issues**
1. Allow pop-ups for the site
2. Check download folder
3. Try right-click "Save As"
4. Use different browser if needed

### Browser Compatibility

#### Recommended Browsers
- **Chrome**: Version 90 or newer
- **Firefox**: Version 88 or newer
- **Safari**: Version 14 or newer
- **Edge**: Version 90 or newer

#### Browser Settings
- **JavaScript**: Must be enabled
- **Cookies**: Allow first-party cookies
- **Pop-ups**: Allow for report downloads
- **Cache**: Clear if experiencing issues

### Technical Requirements

#### Internet Connection
- **Minimum Speed**: 5 Mbps download
- **Recommended**: 25 Mbps for optimal experience
- **Stability**: Consistent connection required during assessments

#### Device Requirements
- **Mobile**: iOS 12+ or Android 8.0+
- **Tablet**: Recent models with updated browsers
- **Desktop**: Any system with modern browser

---

## ❓ Frequently Asked Questions

### Assessment Questions

**Q: How accurate are the assessments?**
A: Our assessments are based on validated screening tools and clinical research. They provide reliable indicators for further evaluation but are not diagnostic tools. Professional evaluation is recommended for definitive diagnosis.

**Q: How often should I reassess my child?**
A: We recommend reassessment every 6-12 months to track developmental changes, or sooner if new concerns arise or significant life changes occur.

**Q: Can I take an assessment for multiple conditions?**
A: Yes, you can complete different types of assessments for each child. Many developmental conditions can co-occur, so comprehensive screening is often helpful.

**Q: What if my child's results change dramatically?**
A: Significant changes can occur due to development, interventions, environmental changes, or life events. Document what might have influenced the change and consider professional consultation.

### Privacy and Security

**Q: How is my child's information protected?**
A: We use bank-level encryption, comply with HIPAA guidelines, and never share personal information without explicit consent. Data is stored securely and access is strictly controlled.

**Q: Can I delete my child's data?**
A: Yes, you can request data deletion at any time. Contact our support team to initiate the process. Note that this action is irreversible.

**Q: Who can see my assessment results?**
A: Only you and authorized users on your account can access results unless you explicitly share them. You control all sharing of your child's information.

### Technical Questions

**Q: Do I need to download any software?**
A: No, CogniKidz is entirely web-based. Simply use your preferred web browser to access all features.

**Q: Can I use the platform on my phone?**
A: Yes, our platform is fully responsive and works on all devices. However, we recommend using a tablet or computer for assessments for the best experience.

**Q: What if I lose internet connection during an assessment?**
A: Your progress is automatically saved. Simply reconnect and resume where you left off.

### Cost and Billing

**Q: Is there a cost to use CogniKidz?**
A: [Information about pricing structure - you'll need to provide specific details about your pricing model]

**Q: Do you accept insurance?**
A: [Information about insurance acceptance - you'll need to provide specific details]

**Q: Can I get a refund?**
A: [Information about refund policy - you'll need to provide specific details]

---

## 📞 Contact Information

### Support Team
- **Email**: support@cognikidz.com
- **Hours**: Monday-Friday, 9 AM - 6 PM EST
- **Response Time**: Within 24 hours

### Clinical Team
- **Email**: clinical@cognikidz.com
- **Hours**: Monday-Friday, 8 AM - 5 PM EST
- **Response Time**: Within 48 hours

### Business Inquiries
- **Email**: info@cognikidz.com
- **Partnership Opportunities**: partnerships@cognikidz.com

---

## 📋 Version Information

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Platform Version**: [Current Platform Version]  

---

*This guide is designed to help you make the most of the CogniKidz platform. For additional support or questions not covered in this guide, please don't hesitate to contact our support team.*

**Disclaimer**: CogniKidz assessments are screening tools designed to identify potential areas of concern. They are not diagnostic instruments and should not replace professional evaluation by qualified healthcare providers. Always consult with appropriate professionals for diagnosis and treatment planning. 
