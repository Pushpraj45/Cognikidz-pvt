# CogniKidz Chatbot - Enhanced with Gamification Knowledge

An intelligent query bot for the CogniKidz platform that helps users navigate the website and provides comprehensive information about ADHD, Autism, and Dyslexia assessments, including interactive gamification features and pricing details.

## 🎯 Key Features

- **Azure OpenAI Integration**: Uses Azure OpenAI for intelligent responses
- **Comprehensive Knowledge Base**: Detailed information about the platform and neurodevelopmental conditions
- **Gamification Expertise**: Deep knowledge of interactive game-based assessments
- **Pricing Information**: Complete pricing and subscription plan details
- **Fallback System**: Provides helpful responses even when AI service is unavailable
- **Session Management**: Maintains conversation context for better user experience
- **Rate Limiting**: Prevents abuse with configurable rate limits
- **Health Monitoring**: Built-in health checks for service monitoring
- **Scope Limitation**: Only responds about disorders and general website features

## 🎮 Gamification Knowledge

### ADHD Interactive Games (₹299/$6.99)

1. **Focus Finder**: Tests sustained attention and visual focus
2. **Impulse Freeze**: Tests self-control and response inhibition
3. **Memory Trail**: Tests working memory and pattern recognition
4. **Hyper Hop**: Tests motor control and movement regulation
5. **Task Twister**: Tests executive function and task switching
6. **Sound Shift**: Tests auditory attention and processing
7. **Time Turtle**: Tests time management and planning

### Dyslexia Interactive Games (₹299/$6.99)

1. **Letter-Sound Matching**: Tests phonemic awareness
2. **Word Sequence Builder**: Tests spelling and letter sequencing
3. **Spot the Correct Word**: Tests visual discrimination
4. **Memory Match**: Tests auditory-verbal memory
5. **Rhyming Pairs**: Tests phonological awareness
6. **Rapid Letter Naming**: Tests rapid naming abilities
7. **Syllable Clapper**: Tests syllable awareness
8. **Visual Tracking Maze**: Tests visual tracking and letter recognition
9. **Word Completion**: Tests word recognition and spelling
10. **Mirror Letter Game**: Tests visual processing and letter orientation

## 💰 Pricing Knowledge

### Individual Assessments

- **General Multi-Disorder Assessment**: FREE
- **ADHD Form Assessment**: ₹199 ($4.99)
- **Autism Form Assessment**: ₹199 ($4.99)
- **Dyslexia Form Assessment**: ₹199 ($4.99)
- **Autism Image Assessment**: ₹249 ($5.99)
- **ADHD Interactive Games**: ₹299 ($6.99)
- **Dyslexia Interactive Games**: ₹299 ($6.99)

### Combo Packages

- **Autism Essential Pack**: ₹349 ($8.99)
- **ADHD Core Pack**: ₹399 ($9.99)
- **Dyslexia Core Pack**: ₹399 ($9.99)
- **Dual Insight Pack**: ₹599 ($14.99)
- **All-Inclusive Pack**: ₹999 ($24.99)

## 🏗️ Architecture

### Backend Components

1. **Controller** (`controller.js`)

   - Handles HTTP requests
   - Input validation and sanitization
   - Error handling with fallback responses

2. **Service** (`service.js`)

   - Azure OpenAI integration
   - Comprehensive knowledge base management
   - Gamification assessment knowledge
   - Pricing information
   - Session context handling
   - Fallback response generation

3. **Routes** (`routes.js`)
   - API endpoint definitions
   - Rate limiting configuration
   - Route-specific middleware

### Frontend Components

1. **ChatService** (`frontend/src/services/ChatService.js`)

   - API communication
   - Error handling
   - Session management

2. **ChatWidget** (`frontend/src/components/ChatWidget.js`)
   - User interface
   - Message formatting
   - Connection status indicators

## 📡 API Endpoints

### POST /api/chatbot/query

Send a message to the chatbot.

**Request:**

```json
{
  "message": "What are the ADHD games?",
  "sessionId": "optional-session-id"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "response": "We offer 7 interactive ADHD games including Focus Finder, Impulse Freeze, Memory Trail...",
    "sessionId": "generated-session-id",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET /api/chatbot/health

Check chatbot service health.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "aiService": "connected",
    "sessionsActive": 5,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🧠 Knowledge Base

The chatbot has comprehensive knowledge about:

### Assessment Types

- **Form-Based Assessments**: Traditional questionnaire assessments
- **Interactive Game-Based Assessments**: Engaging gamification assessments
- **Image-Based Assessments**: Visual-based autism screening
- **General Multi-Disorder Assessment**: Free comprehensive screening

### Platform Features

- Account creation and management
- Child profile setup and management
- Assessment selection and completion
- Progress tracking and monitoring
- Report generation and sharing
- Dashboard navigation

### Neurodevelopmental Conditions

- **ADHD**: Symptoms, early detection, assessment process, interactive games
- **Autism**: Characteristics, benefits of early intervention, form and image assessments
- **Dyslexia**: Reading difficulties, assessment methods, interactive games

### Pricing & Subscriptions

- Individual assessment pricing
- Combo package options
- Savings calculations
- Payment methods

## 🧪 Testing

### Service Testing

```bash
# Test the chatbot service directly
node backend/test-chatbot.js
```

### API Testing

```bash
# Test API endpoints with Node.js
node backend/test-chatbot-api.js

# Test with PowerShell (Windows)
.\backend\test-chatbot-powershell.ps1

# Test with curl (Linux/Mac)
./backend/test-chatbot-curl.sh
```

### Manual Testing Commands

#### Basic Queries

```bash
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "sessionId": "test-1"}'
```

#### Gamification Queries

```bash
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the ADHD games?", "sessionId": "test-2"}'
```

#### Pricing Queries

```bash
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"message": "How much do assessments cost?", "sessionId": "test-3"}'
```

#### Disorder Information

```bash
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"message": "What is ADHD?", "sessionId": "test-4"}'
```

#### Platform Features

```bash
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I create an account?", "sessionId": "test-5"}'
```

### Health Check

```bash
curl -X GET http://localhost:5000/api/chatbot/health
```

## ⚙️ Configuration

### Environment Variables

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_ENDPOINT=your-azure-endpoint
AZURE_DEPLOYMENT_NAME=your-deployment-name
```

### Rate Limiting

- **Default**: 20 requests per minute per IP
- **Configurable** in `routes.js`

## 🔒 Security & Privacy

### Input Validation

- Message length limits (1000 characters)
- Content sanitization
- Rate limiting protection

### Privacy

- No persistent chat history storage
- Session data cleanup (1-hour expiry)
- No personal information collection
- Scope limitation to disorders and website features only

## 🚀 Deployment

### Prerequisites

1. Azure OpenAI service configured
2. Environment variables set
3. Backend server running

### Integration

The chatbot is automatically integrated when the backend server starts. The routes are mounted at `/api/chatbot`.

## 🔧 Troubleshooting

### Common Issues

1. **Azure OpenAI Connection Failed**

   - Check environment variables
   - Verify Azure OpenAI service status
   - Confirm API key permissions

2. **Rate Limiting Errors**

   - Reduce request frequency
   - Check rate limit configuration
   - Monitor IP-based restrictions

3. **Fallback Mode Active**
   - Normal behavior when AI service unavailable
   - Check health endpoint for service status
   - Verify network connectivity

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development` in environment variables.

## 📈 Future Enhancements

- Multi-language support
- Voice input/output capabilities
- Integration with assessment results
- Advanced analytics and insights
- Personalized recommendations based on user history
- Enhanced gamification knowledge
- Real-time assessment progress integration

## 📋 Scope Limitations

The chatbot is specifically designed to:

- ✅ Respond about ADHD, Autism, and Dyslexia disorders
- ✅ Provide information about platform features and navigation
- ✅ Explain assessment types and processes
- ✅ Share pricing and subscription information
- ✅ Guide users through account creation and management
- ✅ Offer technical support for platform issues
- ❌ NOT provide medical diagnoses
- ❌ NOT give medical advice beyond general information
- ❌ NOT discuss technical implementation details
- ❌ NOT respond to queries outside the platform scope

This ensures the chatbot remains focused on its core purpose while providing comprehensive support for the CogniKidz platform.
