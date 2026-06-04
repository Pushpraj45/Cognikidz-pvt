# ChatWidget Integration Guide

This guide explains how to integrate the CogniKidz ChatWidget into your landing page.

## Quick Start

### 1. Import the ChatWidget Component

```jsx
import ChatWidget from './components/ChatWidget';
```

### 2. Add to Your Landing Page

```jsx
function LandingPage() {
  return (
    <div className="landing-page">
      {/* Your existing landing page content */}

      {/* Add the ChatWidget at the bottom */}
      <ChatWidget />
    </div>
  );
}
```

### 3. Ensure CSS is Loaded

The ChatWidget comes with its own CSS file that should be automatically imported. If you need to customize the styling, you can override the CSS variables:

```css
:root {
  --primary: #6366f1;
  --primary-600: #4f46e5;
  --primary-700: #4338ca;
  --secondary: #8b5cf6;
  --accent: #f59e0b;
  --text: #1e293b;
  --dark-text: #e2e8f0;
}
```

## Features

### 🤖 AI-Powered Responses

- Uses Azure OpenAI for intelligent conversations
- Comprehensive knowledge base about ADHD, Autism, and Dyslexia
- Context-aware responses based on conversation history

### 🔄 Fallback System

- Graceful degradation when AI service is unavailable
- Intelligent pattern matching for common queries
- Always provides helpful responses

### 💬 User Experience

- Modern glassmorphism design
- Smooth animations and transitions
- Auto-resizing text input
- Typing indicators
- Connection status indicators

### 🛡️ Security & Performance

- Rate limiting protection
- Input validation
- No persistent chat history storage
- Session-based context (1-hour expiry)

## Configuration

### Environment Variables

Make sure your frontend has the correct API URL configured:

```env
REACT_APP_API_URL=http://localhost:8004/api
```

### Backend Requirements

The ChatWidget requires the backend chatbot API to be running. Ensure:

1. Backend server is running on the configured port
2. Azure OpenAI credentials are properly set
3. Chatbot routes are mounted at `/api/chatbot`

## Customization

### Styling

You can customize the appearance by overriding CSS classes:

```css
/* Custom primary color */
.chat-toggle {
  background: #your-brand-color !important;
}

/* Custom chat container size */
.chat-container {
  width: 400px !important;
  max-height: 500px !important;
}

/* Custom message styling */
.message.bot {
  background-color: #your-bot-color !important;
}
```

### Position

Change the widget position by modifying the CSS:

```css
.chatbot-wrapper {
  bottom: 20px;
  left: 20px; /* Move to left side */
  right: auto;
}
```

### Initial Message

Customize the welcome message in the ChatWidget component:

```jsx
const [messages, setMessages] = useState([
  {
    id: 1,
    text: 'Your custom welcome message here!',
    isBot: true,
    timestamp: new Date().toISOString(),
  },
]);
```

## API Integration

### ChatService Methods

The ChatWidget uses the ChatService for API communication:

```javascript
// Send a message
const response = await ChatService.sendMessage('Hello!');

// Check health status
const health = await ChatService.checkHealth();

// Reset conversation
ChatService.resetSession();
```

### Response Format

The API returns responses in this format:

```json
{
  "success": true,
  "data": {
    "response": "AI-generated response text",
    "sessionId": "unique-session-id",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "fallback": false
  }
}
```

## Troubleshooting

### Common Issues

1. **Widget not appearing**
   - Check if ChatWidget is imported and added to your component
   - Verify CSS is loading correctly
   - Check browser console for errors

2. **API connection errors**
   - Verify backend server is running
   - Check REACT_APP_API_URL environment variable
   - Ensure CORS is configured correctly

3. **Styling issues**
   - Check for CSS conflicts with existing styles
   - Verify CSS variables are defined
   - Use browser dev tools to inspect elements

### Debug Mode

Enable debug logging by opening browser console and setting:

```javascript
localStorage.setItem('chatbot-debug', 'true');
```

## Testing

### Manual Testing

1. Click the chat toggle button
2. Send a greeting message
3. Ask about ADHD, Autism, or Dyslexia
4. Test the reset conversation feature
5. Verify fallback responses work when backend is offline

### Automated Testing

Run the backend test suite:

```bash
cd backend
node tests/chatbot/test-chatbot.js
```

## Performance Considerations

### Optimization Tips

1. **Lazy Loading**: Consider lazy loading the ChatWidget for better initial page load
2. **Session Management**: Sessions auto-expire after 1 hour to prevent memory leaks
3. **Rate Limiting**: Built-in rate limiting prevents abuse
4. **Fallback Responses**: Reduces server load when AI service is unavailable

### Bundle Size

The ChatWidget adds minimal bundle size:

- ChatWidget component: ~15KB
- ChatService: ~5KB
- CSS: ~8KB

## Accessibility

The ChatWidget includes accessibility features:

- Keyboard navigation support
- ARIA labels for screen readers
- High contrast mode support
- Focus management

## Browser Support

Supports all modern browsers:

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review browser console for errors
3. Test with the backend test suite
4. Contact the development team
