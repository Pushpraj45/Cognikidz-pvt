import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatService from '../services/ChatService';
import TranslatedText from './ui/TranslatedText';
import '../styles/ChatWidget.css';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "🌟 Hi there! I'm your CogniKidz AI assistant! I'm here to help you navigate our platform and provide insights about child development assessments for ADHD, Autism, and Dyslexia.\n\n**I can help you with:**\n• Understanding our assessment tools\n• Interpreting your child's results\n• Finding relevant resources and next steps\n• Navigating the CogniKidz platform\n• Connecting you with support\n\nWhat would you like to know about your child's development journey? 💭",
      isBot: true,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const messageContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);

    // Check health when opening chat for the first time
    if (!isOpen) {
      checkChatbotHealth();
    }
  };

  const checkChatbotHealth = async () => {
    try {
      const health = await ChatService.checkHealth();
      setIsConnected(health.status === 'healthy' || health.status === 'degraded');
    } catch (error) {
      console.error('Health check failed:', error);
      setIsConnected(false);
    }
  };

  const handleInputChange = e => {
    setInputValue(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    const userMessage = inputValue.trim();
    const userMessageObj = {
      id: Date.now(),
      text: userMessage,
      isBot: false,
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessageObj]);
    setInputValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Show typing indicator
    setIsTyping(true);

    try {
      // Send message to chatbot service
      const response = await ChatService.sendMessage(userMessage);

      // Update connection status
      setIsConnected(!response.error);

      // Add bot response
      const botResponse = {
        id: Date.now() + 1,
        text: response.response,
        isBot: true,
        timestamp: response.timestamp,
        fallback: response.fallback || false,
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorResponse = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later or contact our support team for assistance.",
        isBot: true,
        timestamp: new Date().toISOString(),
        error: true,
      };

      setMessages(prev => [...prev, errorResponse]);
      setIsConnected(false);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key to send message
  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Reset conversation
  const resetConversation = () => {
    ChatService.resetSession();
    setMessages([
      {
        id: 1,
        text: "🌟 Hi there! I'm your CogniKidz AI assistant! I'm here to help you navigate our platform and provide insights about child development assessments for ADHD, Autism, and Dyslexia.\n\n**I can help you with:**\n• Understanding our assessment tools\n• Interpreting your child's results\n• Finding relevant resources and next steps\n• Navigating the CogniKidz platform\n• Connecting you with support\n\nWhat would you like to know about your child's development journey? 💭",
        isBot: true,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Format message text (simple markdown-like formatting)
  const formatMessage = text => {
    // Convert markdown-style lists to HTML lists
    text = text.replace(/### (.*?)(?=\n|$)/g, '<h3>$1</h3>');
    text = text.replace(/- (.*?)(?=\n|$)/g, '<li>$1</li>');
    text = text.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

    // Convert **bold** to <strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert *italic* to <em>
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Convert line breaks
    text = text.replace(/\n/g, '<br>');
    return text;
  };

  return (
    <div className="chatbot-wrapper">
      {isOpen && (
        <div className="chat-container glassmorph animate-slide-up">
          <div className="chat-header">
            <h3>
              <TranslatedText>CogniKidz Assistant</TranslatedText>
            </h3>
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <button
              className="reset-btn"
              onClick={resetConversation}
              title="Start new conversation"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1505 4.77834 19.6154 7.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M21 3V9H15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button className="close-btn" onClick={toggleChat}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L13 13M1 13L13 1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="message-container" ref={messageContainerRef}>
            {messages.map(message => (
              <div
                key={message.id}
                className={`message ${message.isBot ? 'bot' : 'user'} ${message.fallback ? 'fallback' : ''} ${message.error ? 'error' : ''}`}
              >
                <div
                  className="message-text"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
                />
                {message.fallback && (
                  <div className="message-indicator">
                    <small>
                      <TranslatedText>Offline mode</TranslatedText>
                    </small>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="message bot typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            )}
          </div>
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              placeholder="Type your question..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows="1"
            ></textarea>
            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={inputValue.trim() === ''}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button
        className={`chat-toggle ${isOpen ? 'active' : ''}`}
        onClick={toggleChat}
        aria-label="Toggle chat"
      >
        <div className="pulse-ring"></div>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isOpen ? (
            <path
              d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
              fill="currentColor"
            />
          ) : (
            <path
              d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"
              fill="currentColor"
            />
          )}
        </svg>
      </button>
    </div>
  );
};

export default ChatWidget;
