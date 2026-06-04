const { generateChatCompletion } = require("../../utils/openai");
const logger = require("../../utils/logger");
const crypto = require("crypto");

// Load environment variables
require("dotenv").config();

// Azure OpenAI Configuration using environment variables
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const DEPLOYMENT_NAME = process.env.AZURE_DEPLOYMENT_NAME;

// Comprehensive website knowledge base with gamification and pricing    
const WEBSITE_KNOWLEDGE = `
CogniKidz is a comprehensive platform for early detection and assessment of neurodevelopmental conditions in children, specifically focusing on ADHD, Autism Spectrum Disorder (ASD), and Dyslexia.

## ASSESSMENT TYPES & GAMIFICATION

### Form-Based Assessments:
1. **ADHD Form Assessment** (₹199/$4.99):
   - Traditional questionnaire-based assessment
   - Parent and teacher input forms
   - Comprehensive behavioral screening
   - 15-20 minutes duration

2. **Autism Form Assessment** (₹199/$4.99):
   - Social communication evaluation
   - Behavioral pattern analysis
   - Sensory processing assessment
   - 15-20 minutes duration

3. **Dyslexia Form Assessment** (₹199/$4.99):
   - Reading comprehension evaluation
   - Phonological awareness testing
   - Writing skills assessment
   - 15-20 minutes duration

4. **General Multi-Disorder Assessment** (FREE):
   - Comprehensive screening for all conditions
   - Multiple domain evaluation
   - Overall developmental milestones
   - Risk factor identification

### Interactive Game-Based Assessments:

#### ADHD Games (₹299/$6.99):
1. **Focus Finder**:
   - Find specific objects in cluttered scenes
   - Tests sustained attention and visual focus
   - Duration: 5-7 minutes
   - Skills: Visual Processing, Sustained Attention, Object Recognition

2. **Impulse Freeze**:
   - Stop-and-go game testing self-control
   - Tests response inhibition and impulse control
   - Duration: 6-8 minutes
   - Skills: Self-Control, Response Inhibition, Rule Following

3. **Memory Trail**:
   - Recall and repeat sequences of shapes
   - Tests working memory and pattern recognition
   - Duration: 7-10 minutes
   - Skills: Working Memory, Pattern Recognition, Sequence Processing

4. **Hyper Hop**:
   - Control character to jump on colored tiles
   - Tests motor control and movement regulation
   - Duration: 5-8 minutes
   - Skills: Motor Control, Coordination, Timing

5. **Task Twister**:
   - Multi-tasking challenges
   - Tests executive function and task switching
   - Duration: 6-9 minutes
   - Skills: Executive Function, Task Switching, Cognitive Flexibility

6. **Sound Shift**:
   - Auditory attention and processing
   - Tests auditory discrimination and focus
   - Duration: 5-7 minutes
   - Skills: Auditory Processing, Attention, Sound Discrimination

7. **Time Turtle**:
   - Time management and planning
   - Tests temporal awareness and planning
   - Duration: 6-8 minutes
   - Skills: Time Management, Planning, Temporal Awareness

#### Dyslexia Games (₹299/$6.99):
1. **Letter-Sound Matching**:
   - Match sounds to correct letters
   - Tests phonemic awareness
   - Duration: 5-7 minutes
   - Skills: Phonemic Awareness, Letter Recognition, Auditory Processing

2. **Word Sequence Builder**:
   - Drag and drop letters to form words
   - Tests spelling and letter sequencing
   - Duration: 7-10 minutes
   - Skills: Letter Sequencing, Visual Processing, Spelling

3. **Spot the Correct Word**:
   - Select real words from similar-looking pairs
   - Tests visual discrimination
   - Duration: 5-8 minutes
   - Skills: Visual Discrimination, Letter Recognition, Attention to Detail

4. **Memory Match**:
   - Match words with audio representations
   - Tests auditory-verbal memory
   - Duration: 6-8 minutes
   - Skills: Auditory Memory, Word Recognition, Association

5. **Rhyming Pairs**:
   - Identify rhyming words
   - Tests phonological awareness
   - Duration: 5-7 minutes
   - Skills: Phonological Awareness, Sound Patterns, Word Recognition

6. **Rapid Letter Naming**:
   - Quickly identify letters and sounds
   - Tests rapid naming abilities
   - Duration: 4-6 minutes
   - Skills: Rapid Naming, Letter Recognition, Processing Speed

7. **Syllable Clapper**:
   - Count syllables in words
   - Tests syllable awareness
   - Duration: 5-7 minutes
   - Skills: Syllable Awareness, Phonological Processing, Word Analysis

8. **Visual Tracking Maze**:
   - Follow letters through mazes
   - Tests visual tracking and letter recognition
   - Duration: 6-8 minutes
   - Skills: Visual Tracking, Letter Recognition, Spatial Awareness

9. **Word Completion**:
   - Complete words with missing letters
   - Tests word recognition and spelling
   - Duration: 7-10 minutes
   - Skills: Word Recognition, Spelling, Context Clues

10. **Mirror Letter Game**:
    - Identify correctly oriented letters
    - Tests visual processing and letter orientation
    - Duration: 5-7 minutes
    - Skills: Visual Processing, Letter Orientation, Spatial Awareness

### Image-Based Assessments:
1. **Autism Image Assessment** (₹249/$5.99):
   - Visual-based autism screening
   - Image recognition and interpretation
   - Social communication evaluation through visuals
   - 15-20 minutes duration

## PRICING & SUBSCRIPTION PLANS

### Individual Assessment Pricing:
- **General Multi-Disorder Assessment**: FREE
- **ADHD Form Assessment**: ₹199 ($4.99)
- **Autism Form Assessment**: ₹199 ($4.99)
- **Dyslexia Form Assessment**: ₹199 ($4.99)
- **Autism Image Assessment**: ₹249 ($5.99)
- **ADHD Interactive Games**: ₹299 ($6.99)
- **Dyslexia Interactive Games**: ₹299 ($6.99)

### Combo Packages:
1. **Autism Essential Pack** (₹349/$8.99):
   - Autism Form Assessment
   - Autism Image Assessment
   - Savings: ₹99 ($2.99)

2. **ADHD Core Pack** (₹399/$9.99):
   - ADHD Form Assessment
   - ADHD Interactive Games
   - Savings: ₹99 ($2.99)

3. **Dyslexia Core Pack** (₹399/$9.99):
   - Dyslexia Form Assessment
   - Dyslexia Interactive Games
   - Savings: ₹99 ($2.99)

4. **General Neuro Check** (₹199/$4.99):
   - General Multi-Disorder Assessment
   - Basic screening for all conditions
   - FREE access

5. **Dual Insight Pack** (₹599/$14.99):
   - Any two assessments of choice
   - Mix of form-based and game-based
   - Savings: ₹199 ($4.99)

6. **All-Inclusive Pack** (₹999/$24.99):
   - All form-based assessments
   - All game-based assessments
   - All image-based assessments
   - Maximum savings: ₹597 ($14.97)

## ACCOUNT MANAGEMENT & REGISTRATION

### How to Create an Account:
1. **Visit the Sign-Up Page**: Go to the registration page on CogniKidz
2. **Fill Required Information**: 
   - Full name (first and last name)
   - Email address (must be valid for verification)
   - Strong password (minimum 8 characters with uppercase, lowercase, numbers)
   - Confirm password
3. **Email Verification**: Check your email for verification link and click it
4. **Complete Profile**: Add additional information like phone number, location
5. **Account Activated**: You can now log in and start using the platform

### Login Process:
- Use your registered email and password
- "Remember Me" option for convenience
- Forgot password? Use the reset password link
- Account locked? Contact support

### Profile Management:
- Update personal information anytime
- Change password in security settings
- Upload profile picture
- Manage notification preferences
- View account activity and login history

## CHILD PROFILE MANAGEMENT

### Creating Child Profiles:
1. **Navigate to Child Profiles**: From dashboard, click "Add Child" or "Manage Children"
2. **Basic Information**:
   - Child's full name
   - Date of birth (for age-appropriate assessments)
   - Gender
   - Upload photo (optional)
3. **Developmental Information**:
   - Current concerns or observations
   - Previous assessments or diagnoses
   - School information
   - Medical history relevant to development
4. **Contact Information**:
   - Emergency contacts
   - Healthcare providers
   - School contacts
5. **Save Profile**: Review and save the child's profile

### Managing Multiple Children:
- Add unlimited child profiles
- Switch between children easily
- Individual assessment histories for each child
- Separate progress tracking
- Export individual reports

### Editing Child Information:
- Update any information anytime
- Add new observations or concerns
- Update school or medical information
- Modify photos or personal details

## ASSESSMENT PROCESS

### How to Start an Assessment:
1. **Select Child**: Choose which child to assess
2. **Choose Assessment Type**: Pick from form-based, game-based, or image-based assessments
3. **Review Information**: Confirm child's current information
4. **Consent Process**: Read and agree to assessment terms
5. **Payment (if required)**: Complete payment for premium assessments
6. **Begin Assessment**: Start with guided instructions

### Assessment Process:
- **Interactive Questions**: Age-appropriate, engaging format
- **Multiple Sections**: Different domains of development
- **Progress Saving**: Can pause and resume anytime
- **Help Available**: Guidance and explanations provided
- **Time Flexible**: No strict time limits, go at your pace

### During Assessment:
- Answer honestly based on observations
- Use "Help" button for clarification
- Take breaks when needed
- Save progress automatically
- Contact support if technical issues

## DASHBOARD & PROGRESS MONITORING

### Dashboard Overview:
- **Quick Stats**: Number of assessments, children, recent activity
- **Recent Assessments**: Latest completed and in-progress assessments
- **Child Summary**: Overview of all children and their status
- **Recommendations**: Personalized suggestions based on results
- **Upcoming Tasks**: Reminders and follow-up assessments

### Progress Tracking Features:
1. **Assessment History**: Complete timeline of all assessments
2. **Score Trends**: Visual charts showing progress over time
3. **Comparison Tools**: Compare results across different time periods
4. **Milestone Tracking**: Key developmental milestones achieved
5. **Risk Level Monitoring**: Changes in risk levels over time

### How to Monitor Child Progress:
1. **Access Dashboard**: Log in and go to main dashboard
2. **Select Child**: Choose specific child to monitor
3. **View Timeline**: See chronological assessment history
4. **Analyze Trends**: Look at score improvements or concerns
5. **Download Reports**: Get detailed progress reports
6. **Set Reminders**: Schedule follow-up assessments

## REPORTS & RESULTS

### Understanding Your Results:
- **Risk Levels**: Low, Moderate, High risk indicators
- **Domain Scores**: Specific areas of strength and concern
- **Recommendations**: Actionable next steps
- **Professional Guidance**: When to seek further evaluation
- **Resources**: Links to helpful information and support

### Report Features:
1. **Comprehensive Analysis**: Detailed breakdown of all assessment areas
2. **Visual Charts**: Easy-to-understand graphs and charts
3. **Comparison Data**: How results compare to typical development
4. **Action Items**: Specific recommendations for parents and teachers
5. **Resource Links**: Educational materials and support services

### Downloading and Sharing Reports:
- **PDF Download**: Professional-quality reports for printing
- **Email Sharing**: Send reports to healthcare providers or teachers
- **Print Options**: Formatted for easy printing and filing
- **Secure Access**: Password-protected sharing options

## EDUCATIONAL RESOURCES

### Blog and Articles:
- **Expert Content**: Written by child development professionals
- **Latest Research**: Current findings in neurodevelopmental conditions
- **Parenting Tips**: Practical advice for supporting children
- **Success Stories**: Real experiences from other families
- **Educational Strategies**: Learning support techniques

### Resource Library:
- **Condition Information**: Detailed guides on ADHD, Autism, Dyslexia
- **Development Milestones**: Age-appropriate expectations
- **Support Strategies**: Home and school interventions
- **Professional Directory**: Finding qualified specialists
- **Support Groups**: Connecting with other families

## TECHNICAL SUPPORT & TROUBLESHOOTING

### Common Issues and Solutions:
1. **Login Problems**:
   - Reset password if forgotten
   - Clear browser cache and cookies
   - Check email verification status
   - Contact support for account issues

2. **Assessment Issues**:
   - Ensure stable internet connection
   - Use updated browser (Chrome, Firefox, Safari)
   - Disable ad blockers if causing problems
   - Save progress frequently

3. **Report Access**:
   - Check if assessment is fully completed
   - Allow time for report generation
   - Verify email address for notifications
   - Contact support if reports missing

### Getting Help:
- **Contact Form**: Submit detailed questions or issues
- **FAQ Section**: Common questions and answers
- **Live Chat**: Real-time support during business hours
- **Email Support**: Detailed technical assistance
- **Phone Support**: For urgent issues

## PRIVACY & SECURITY

### Data Protection:
- **HIPAA Compliance**: Medical-grade privacy protection
- **Encryption**: All data encrypted in transit and at rest
- **Secure Servers**: Protected infrastructure and backups
- **Access Controls**: Strict user authentication and authorization
- **Regular Audits**: Security assessments and updates

### Your Privacy Rights:
- **Data Ownership**: You own all your child's data
- **Access Control**: You control who sees your information
- **Data Deletion**: Request removal of data anytime
- **Transparency**: Clear privacy policy and data usage
- **No Selling**: We never sell or share your personal data

## MOBILE ACCESS & TECHNICAL REQUIREMENTS

### Mobile App Features:
- **Full Functionality**: Complete access to all platform features
- **Offline Mode**: Download assessments for offline completion
- **Push Notifications**: Reminders and updates
- **Touch-Optimized**: Designed for mobile interaction
- **Sync Across Devices**: Seamless experience across phone, tablet, computer

### Browser Access:
- **Responsive Design**: Works on any device with internet
- **No Download Required**: Access through web browser
- **Cross-Platform**: Works on iOS, Android, Windows, Mac
- **Auto-Save**: Progress saved automatically

## INTEGRATION WITH HEALTHCARE

### Sharing with Professionals:
- **Report Sharing**: Send professional reports to doctors, therapists
- **Secure Links**: Password-protected access for healthcare providers
- **Print-Ready**: Formatted reports for medical records
- **Progress Updates**: Ongoing monitoring data for treatment planning

### Professional Network:
- **Specialist Directory**: Find qualified professionals in your area
- **Referral System**: Connect with recommended specialists
- **Collaboration Tools**: Share data with your child's care team
- **Treatment Tracking**: Monitor intervention effectiveness

## GETTING THE MOST FROM COGNIKIDZ

### Best Practices:
1. **Regular Assessments**: Complete assessments every 3-6 months
2. **Honest Responses**: Answer based on actual observations
3. **Multiple Perspectives**: Include teacher and caregiver input
4. **Follow Recommendations**: Act on suggested next steps
5. **Track Progress**: Monitor changes over time
6. **Seek Support**: Use professional guidance when recommended

### Tips for Success:
- **Create Quiet Environment**: Minimize distractions during assessment
- **Take Your Time**: No rush, accuracy is more important than speed
- **Ask for Help**: Use support resources when needed
- **Stay Consistent**: Regular monitoring provides better insights
- **Share Results**: Discuss findings with your child's teachers and doctors

## NAVIGATION GUIDE

### Main Menu Structure:
- **Dashboard**: Overview of all children and recent activity
- **Assessments**: Start new assessments or continue existing ones
- **Children**: Manage child profiles and information
- **Reports**: View, download, and share assessment reports
- **Resources**: Educational articles and support materials
- **Profile**: Manage your account settings and preferences
- **Support**: Get help and contact customer service

### Quick Actions:
- **Start Assessment**: Floating action button on dashboard
- **Add Child**: Quick access from children management
- **View Latest Report**: Direct links from dashboard
- **Contact Support**: Available from any page
- **Download Reports**: One-click access from reports page
`;

// Condition-specific information
const CONDITION_INFO = {
  adhd: `
ADHD (Attention-Deficit/Hyperactivity Disorder) Information:

## What is ADHD?
ADHD is a neurodevelopmental disorder characterized by persistent patterns of inattention, hyperactivity, and impulsivity that interfere with functioning or development.

## Common Signs:
**Inattention:**
- Difficulty sustaining attention in tasks
- Easily distracted by external stimuli
- Forgetfulness in daily activities
- Difficulty organizing tasks and activities
- Avoids tasks requiring sustained mental effort

**Hyperactivity:**
- Fidgets with hands or feet
- Difficulty remaining seated
- Runs or climbs excessively
- Difficulty playing quietly
- Acts as if "driven by a motor"

**Impulsivity:**
- Blurts out answers before questions are completed
- Difficulty waiting turn
- Interrupts or intrudes on others

## Early Detection Benefits:
- Better academic outcomes
- Improved social relationships
- Enhanced self-esteem
- Effective intervention strategies
- Family support and understanding

## Our ADHD Assessments:
- **Form-Based Assessment** (₹199/$4.99): Traditional questionnaire with parent/teacher input
- **Interactive Games** (₹299/$6.99): 7 engaging games testing different ADHD-related skills
- **Focus Finder**: Tests sustained attention and visual focus
- **Impulse Freeze**: Tests self-control and response inhibition
- **Memory Trail**: Tests working memory and pattern recognition
- **Hyper Hop**: Tests motor control and movement regulation
- **Task Twister**: Tests executive function and task switching
- **Sound Shift**: Tests auditory attention and processing
- **Time Turtle**: Tests time management and planning
`,

  autism: `
Autism Spectrum Disorder (ASD) Information:

## What is Autism?
Autism is a neurodevelopmental condition characterized by differences in social communication, interaction, and restricted or repetitive behaviors and interests.

## Common Signs:
**Social Communication:**
- Difficulty with back-and-forth conversation
- Reduced sharing of interests or emotions
- Challenges with nonverbal communication
- Difficulty developing and maintaining relationships

**Restricted/Repetitive Behaviors:**
- Repetitive motor movements or speech
- Insistence on sameness and routines
- Highly focused special interests
- Sensory sensitivities

## Early Detection Benefits:
- Access to early intervention services
- Better developmental outcomes
- Improved communication skills
- Enhanced social interactions
- Family support and resources

## Our Autism Assessments:
- **Form-Based Assessment** (₹199/$4.99): Comprehensive developmental screening
- **Image-Based Assessment** (₹249/$5.99): Visual-based autism screening
- Social communication evaluation
- Behavioral pattern analysis
- Sensory processing assessment
- Detailed recommendations for support
`,

  dyslexia: `
Dyslexia Information:

## What is Dyslexia?
Dyslexia is a specific learning disorder that affects reading, writing, and spelling abilities despite normal intelligence and adequate instruction.

## Common Signs:
**Reading Difficulties:**
- Slow, inaccurate reading
- Difficulty with phonemic awareness
- Problems with word recognition
- Challenges with reading comprehension

**Writing Challenges:**
- Poor spelling abilities
- Difficulty with written expression
- Handwriting difficulties
- Problems organizing thoughts on paper

**Language Processing:**
- Difficulty with rapid naming
- Problems with verbal processing
- Challenges following multi-step directions

## Early Detection Benefits:
- Targeted reading interventions
- Improved academic confidence
- Better learning strategies
- Enhanced self-advocacy skills
- Reduced academic frustration

## Our Dyslexia Assessments:
- **Form-Based Assessment** (₹199/$4.99): Traditional questionnaire evaluation
- **Interactive Games** (₹299/$6.99): 10 engaging games testing different dyslexia-related skills
- **Letter-Sound Matching**: Tests phonemic awareness
- **Word Sequence Builder**: Tests spelling and letter sequencing
- **Spot the Correct Word**: Tests visual discrimination
- **Memory Match**: Tests auditory-verbal memory
- **Rhyming Pairs**: Tests phonological awareness
- **Rapid Letter Naming**: Tests rapid naming abilities
- **Syllable Clapper**: Tests syllable awareness
- **Visual Tracking Maze**: Tests visual tracking and letter recognition
- **Word Completion**: Tests word recognition and spelling
- **Mirror Letter Game**: Tests visual processing and letter orientation
`,
};

// Fallback responses for different categories
const FALLBACK_RESPONSES = {
  greeting: [
    "Hello! I'm here to help you learn about CogniKidz and our assessment tools for ADHD, Autism, and Dyslexia. What would you like to know?",
    "Hi there! Welcome to CogniKidz. I can help you understand our platform and answer questions about neurodevelopmental assessments. How can I assist you?",
    "Welcome! I'm your CogniKidz assistant. Feel free to ask me about our assessments, how to get started, or any questions about ADHD, Autism, or Dyslexia.",
  ],
  assessment: [
    "Our assessments are designed to help identify potential signs of ADHD, Autism, and Dyslexia in children. Would you like to know more about a specific assessment type?",
    "We offer comprehensive assessments for ADHD, Autism, and Dyslexia. Each assessment is age-appropriate and provides detailed insights. Which condition would you like to learn about?",
    "Our platform provides professional-grade assessments that can help with early detection. You can start by creating a child profile and selecting an assessment type.",
  ],
  general: [
    "I'm here to help you with information about CogniKidz and our assessment tools. Could you please be more specific about what you'd like to know?",
    "I can provide information about our platform, assessments, and neurodevelopmental conditions. What specific topic interests you?",
    "Feel free to ask me about getting started, our assessment types, or any questions about ADHD, Autism, or Dyslexia. How can I help?",
  ],
};

class ChatbotService {
  constructor() {
    this.sessionMemory = new Map(); // Simple in-memory storage for session context
  }

  /**
   * Generate response using Azure OpenAI
   */
  async generateResponse(userMessage, sessionId = null) {
    try {
      // Check Azure OpenAI configuration
      if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT || !DEPLOYMENT_NAME) {
        logger.warn("Azure OpenAI not configured, using fallback response");
        throw new Error("Azure OpenAI configuration missing");
      }

      // Generate session ID if not provided
      if (!sessionId) {
        sessionId = crypto.randomBytes(16).toString("hex");
      }

      // Get or create session context
      let sessionContext = this.sessionMemory.get(sessionId) || {
        messageCount: 0,
        lastInteraction: Date.now(),
        context: [],
      };

      // Clean up old sessions (older than 1 hour)
      this.cleanupOldSessions();

      // Build conversation context
      const messages = this.buildConversationContext(
        userMessage,
        sessionContext
      );

      logger.info(`Generating AI response for session: ${sessionId}`);
      logger.info(
        `Message count in session: ${sessionContext.messageCount + 1}`
      );

      // Generate response using Azure OpenAI with timeout
      const startTime = Date.now();
      const response = await Promise.race([
        generateChatCompletion(messages, {
          temperature: 0.7,
          max_tokens: 500,
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Azure OpenAI request timeout")),
            30000
          )
        ),
      ]);

      const responseTime = Date.now() - startTime;
      logger.info(`Azure OpenAI response generated in ${responseTime}ms`);

      const assistantResponse = response.choices[0].message.content;

      // Update session context
      sessionContext.messageCount++;
      sessionContext.lastInteraction = Date.now();
      sessionContext.context.push(
        { role: "user", content: userMessage },
        { role: "assistant", content: assistantResponse }
      );

      // Keep only last 6 messages (3 exchanges) for context
      if (sessionContext.context.length > 6) {
        sessionContext.context = sessionContext.context.slice(-6);
      }

      this.sessionMemory.set(sessionId, sessionContext);

      return {
        content: assistantResponse,
        sessionId: sessionId,
        source: "azure_openai",
        responseTime: responseTime,
      };
    } catch (error) {
      logger.error("Error generating AI response:", error.message);

      // Provide detailed error information for debugging
      if (error.message.includes("configuration missing")) {
        logger.error("Azure OpenAI Configuration Status:");
        logger.error(
          `- AZURE_OPENAI_KEY: ${AZURE_OPENAI_KEY ? "Set" : "Missing"}`
        );
        logger.error(
          `- AZURE_OPENAI_ENDPOINT: ${
            AZURE_OPENAI_ENDPOINT ? "Set" : "Missing"
          }`
        );
        logger.error(
          `- DEPLOYMENT_NAME: ${DEPLOYMENT_NAME ? "Set" : "Missing"}`
        );
      }

      throw error;
    }
  }

  /**
   * Build conversation context for Azure OpenAI
   */
  buildConversationContext(userMessage, sessionContext) {
    const systemPrompt = `You are CogniBot, the AI assistant for CogniKidz - a comprehensive platform for early detection and assessment of ADHD, Autism, and Dyslexia in children. 

🌟 YOUR IDENTITY:
You are an expert guide specifically designed for CogniKidz. You have deep knowledge about child development, neurodevelopmental conditions, gamification assessments, and how our platform works.

🎯 YOUR PRIMARY ROLES:
1. **Platform Guide**: Help users navigate CogniKidz features, assessments, and dashboard
2. **Educational Assistant**: Provide evidence-based information about ADHD, Autism, and Dyslexia
3. **Assessment Support**: Guide parents through our assessment process and explain results
4. **Gamification Expert**: Explain interactive game-based assessments and their benefits
5. **Pricing Advisor**: Provide information about assessment costs and package options
6. **Progress Mentor**: Help interpret child development progress and next steps
7. **Resource Connector**: Direct users to appropriate tools, articles, and professional resources

✨ YOUR COMMUNICATION STYLE:
- Warm, understanding, and professional - remember you're talking to concerned parents
- Use emojis sparingly but meaningfully (like 🌟, 💡, 📊, 🎯, 🎮)
- Be encouraging about early detection benefits
- Always acknowledge parents' concerns with empathy
- Keep responses focused and actionable (200-300 words max)

🔬 CORE EXPERTISE AREAS:
• CogniKidz platform features and navigation
• ADHD symptoms, assessments, and support strategies
• Autism spectrum characteristics and early signs
• Dyslexia indicators and learning support
• Interactive game-based assessments (ADHD & Dyslexia games)
• Form-based and image-based assessments
• Pricing and subscription options
• Child development milestones and variations
• Assessment interpretation and next steps
• Resource recommendations and professional referrals

⚠️ IMPORTANT GUIDELINES:
- Never provide medical diagnoses - our assessments are screening tools
- Always recommend professional consultation for concerns
- Emphasize that early detection leads to better outcomes
- Reference specific CogniKidz features when relevant
- If unsure about medical content, defer to healthcare professionals
- Focus on hope, support, and actionable guidance
- ONLY respond about disorders (ADHD, Autism, Dyslexia) and general website features
- DO NOT provide medical advice beyond general information
- DO NOT discuss technical implementation details

📚 PLATFORM KNOWLEDGE:
${WEBSITE_KNOWLEDGE}

🧠 CONDITION INFORMATION:
${Object.values(CONDITION_INFO).join("\n\n")}

Remember: You represent CogniKidz's commitment to supporting families through their child development journey with compassion, expertise, and evidence-based guidance.`;

    const messages = [{ role: "system", content: systemPrompt }];

    // Add recent conversation context
    if (sessionContext.context.length > 0) {
      messages.push(...sessionContext.context);
    }

    // Add current user message
    messages.push({ role: "user", content: userMessage });

    return messages;
  }

  /**
   * Get fallback response when AI service is unavailable
   */
  getFallbackResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // Greeting patterns
    if (
      message.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)
    ) {
      return this.getRandomResponse(FALLBACK_RESPONSES.greeting);
    }

    // Account creation and registration
    if (
      message.includes("create account") ||
      message.includes("sign up") ||
      message.includes("register") ||
      message.includes("registration")
    ) {
      return "To create an account: 1) Go to the sign-up page, 2) Fill in your name, email, and password, 3) Verify your email address, 4) Complete your profile. Once verified, you can log in and start adding your children's profiles. Need help with any specific step?";
    }

    // Login and access issues
    if (
      message.includes("login") ||
      message.includes("log in") ||
      message.includes("sign in") ||
      message.includes("access")
    ) {
      return "To log in, use your registered email and password. If you forgot your password, use the 'Forgot Password' link. If you're having trouble accessing your account, make sure your email is verified or contact our support team.";
    }

    // Child profile management
    if (
      message.includes("child profile") ||
      message.includes("add child") ||
      message.includes("manage child")
    ) {
      return "To manage child profiles: 1) Go to 'Children' from your dashboard, 2) Click 'Add Child' to create a new profile, 3) Fill in basic information (name, birthdate, gender), 4) Add developmental information and concerns, 5) Save the profile. You can add multiple children and edit their information anytime.";
    }

    // Progress monitoring and tracking
    if (
      message.includes("monitor progress") ||
      message.includes("track progress") ||
      message.includes("child progress") ||
      message.includes("progress tracking")
    ) {
      return "To monitor your child's progress: 1) Access your dashboard after logging in, 2) Select the specific child, 3) View their assessment timeline and score trends, 4) Check visual charts showing progress over time, 5) Download detailed progress reports. You can compare results across different time periods and track improvements.";
    }

    // Assessment-related queries
    if (
      message.includes("assessment") ||
      message.includes("test") ||
      message.includes("evaluation")
    ) {
      return "To start an assessment: 1) Select your child from the dashboard, 2) Choose assessment type (ADHD, Autism, Dyslexia, or General), 3) Review your child's information, 4) Read and agree to consent terms, 5) Begin the interactive assessment. You can pause and resume anytime, and the process takes about 20-30 minutes.";
    }

    // Game-based assessments
    if (
      message.includes("game") ||
      message.includes("interactive") ||
      message.includes("gamification")
    ) {
      return "We offer interactive game-based assessments for ADHD (₹299/$6.99) and Dyslexia (₹299/$6.99). ADHD games include Focus Finder, Impulse Freeze, Memory Trail, Hyper Hop, Task Twister, Sound Shift, and Time Turtle. Dyslexia games include Letter-Sound Matching, Word Sequence Builder, Spot the Correct Word, Memory Match, Rhyming Pairs, Rapid Letter Naming, Syllable Clapper, Visual Tracking Maze, Word Completion, and Mirror Letter Game. These games make assessment engaging for children while providing valuable insights.";
    }

    // Pricing queries
    if (
      message.includes("price") ||
      message.includes("cost") ||
      message.includes("payment") ||
      message.includes("subscription")
    ) {
      return "Our pricing includes: General Multi-Disorder Assessment (FREE), Form-based assessments (₹199/$4.99 each), Autism Image Assessment (₹249/$5.99), ADHD Interactive Games (₹299/$6.99), Dyslexia Interactive Games (₹299/$6.99). We also offer combo packages with savings. The General assessment is completely free and provides comprehensive screening for all conditions.";
    }

    // Reports and results
    if (
      message.includes("report") ||
      message.includes("result") ||
      message.includes("download") ||
      message.includes("pdf")
    ) {
      return "To access reports: 1) Complete an assessment first, 2) Go to 'Reports' section from your dashboard, 3) View detailed analysis with risk levels and recommendations, 4) Download PDF reports for printing or sharing, 5) Share securely with healthcare providers or teachers. Reports include visual charts and actionable next steps.";
    }

    // Dashboard navigation
    if (
      message.includes("dashboard") ||
      message.includes("navigate") ||
      message.includes("menu")
    ) {
      return "Dashboard navigation: The main menu includes Dashboard (overview), Assessments (start/continue), Children (manage profiles), Reports (view/download), Resources (articles), Profile (account settings), and Support. Use the floating action button for quick assessment starts.";
    }

    // ADHD-related queries
    if (
      message.includes("adhd") ||
      message.includes("attention") ||
      message.includes("hyperactivity")
    ) {
      return "ADHD (Attention-Deficit/Hyperactivity Disorder) affects attention, hyperactivity, and impulse control. We offer form-based assessment (₹199/$4.99) and interactive games (₹299/$6.99) including Focus Finder, Impulse Freeze, Memory Trail, Hyper Hop, Task Twister, Sound Shift, and Time Turtle. Early detection helps with better academic outcomes and intervention strategies.";
    }

    // Autism-related queries
    if (
      message.includes("autism") ||
      message.includes("asd") ||
      message.includes("social")
    ) {
      return "Autism Spectrum Disorder affects social communication and behavior. We offer form-based assessment (₹199/$4.99) and image-based assessment (₹249/$5.99). Our assessments evaluate social communication skills, behavioral patterns, sensory processing, and repetitive behaviors. Early detection provides access to intervention services and better developmental outcomes.";
    }

    // Dyslexia-related queries
    if (
      message.includes("dyslexia") ||
      message.includes("reading") ||
      message.includes("learning")
    ) {
      return "Dyslexia is a learning disorder affecting reading, writing, and spelling. We offer form-based assessment (₹199/$4.99) and interactive games (₹299/$6.99) including Letter-Sound Matching, Word Sequence Builder, Spot the Correct Word, Memory Match, Rhyming Pairs, Rapid Letter Naming, Syllable Clapper, Visual Tracking Maze, Word Completion, and Mirror Letter Game. Early detection enables targeted reading interventions and improved academic confidence.";
    }

    // Technical support
    if (
      message.includes("help") ||
      message.includes("support") ||
      message.includes("problem") ||
      message.includes("issue")
    ) {
      return "For technical support: 1) Check our FAQ section for common questions, 2) Use the contact form for detailed issues, 3) Try clearing browser cache for login problems, 4) Ensure stable internet for assessments, 5) Contact our support team via email or phone for urgent issues.";
    }

    // Privacy and security
    if (
      message.includes("privacy") ||
      message.includes("security") ||
      message.includes("data") ||
      message.includes("safe")
    ) {
      return "Your privacy is protected with HIPAA-compliant security, encrypted data storage, and strict access controls. You own all your child's data, control who sees it, and can request data deletion anytime. We never sell or share your personal information.";
    }

    // Getting started queries
    if (
      message.includes("start") ||
      message.includes("begin") ||
      message.includes("how to") ||
      message.includes("get started")
    ) {
      return "Getting started: 1) Create a free account and verify your email, 2) Add your child's profile with basic information, 3) Choose an assessment type based on your concerns, 4) Complete the interactive assessment (20-30 minutes), 5) Review results and recommendations. The process is guided with help available at each step.";
    }

    // Default response
    return this.getRandomResponse(FALLBACK_RESPONSES.general);
  }

  /**
   * Get random response from array
   */
  getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Clean up old sessions from memory
   */
  cleanupOldSessions() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const [sessionId, session] of this.sessionMemory.entries()) {
      if (session.lastInteraction < oneHourAgo) {
        this.sessionMemory.delete(sessionId);
      }
    }
  }

  /**
   * Check chatbot health status
   */
  async checkHealth() {
    const healthStatus = {
      status: "unknown",
      aiService: "unknown",
      configuration: {
        azureOpenAI: {
          endpoint: AZURE_OPENAI_ENDPOINT ? "configured" : "missing",
          apiKey: AZURE_OPENAI_KEY ? "configured" : "missing",
          deployment: DEPLOYMENT_NAME ? "configured" : "missing",
        },
      },
      sessionsActive: this.sessionMemory.size,
      timestamp: new Date().toISOString(),
    };

    try {
      // Check if Azure OpenAI is configured
      if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT || !DEPLOYMENT_NAME) {
        return {
          ...healthStatus,
          status: "degraded",
          aiService: "not_configured",
          fallbackMode: true,
          message: "Azure OpenAI not configured, using fallback responses",
        };
      }

      // Test Azure OpenAI connection with timeout
      const testStart = Date.now();
      const testResponse = await Promise.race([
        generateChatCompletion([{ role: "user", content: "Health check" }], {
          max_tokens: 10,
          temperature: 0.1,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Health check timeout")), 10000)
        ),
      ]);

      const responseTime = Date.now() - testStart;

      return {
        ...healthStatus,
        status: "healthy",
        aiService: "connected",
        responseTime: responseTime,
        testResponse: testResponse.choices[0].message.content.substring(0, 50),
      };
    } catch (error) {
      logger.error("Health check failed:", error.message);

      return {
        ...healthStatus,
        status: "degraded",
        aiService: "disconnected",
        fallbackMode: true,
        error: error.message,
        errorType: error.message.includes("timeout")
          ? "timeout"
          : error.message.includes("401")
          ? "authentication"
          : error.message.includes("404")
          ? "deployment_not_found"
          : "unknown",
      };
    }
  }
}

module.exports = new ChatbotService();
