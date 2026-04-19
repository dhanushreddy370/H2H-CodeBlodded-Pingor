import React, { useState } from 'react';
import { Send, Bot } from 'lucide-react';

const AIAssistant = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', text: 'Hello! I am your Pingor AI assistant. How can I help you manage your emails today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const prompts = [
    "Show my pending tasks",
    "Summarize today's emails",
    "Draft a follow-up to Emma",
    "Find emails from Team X"
  ];

  const handleSend = async (textOveride) => {
    const messageText = textOveride || input;
    if (!messageText.trim()) return;
    
    // Add user message to UI
    const newMsg = { id: Date.now(), type: 'user', text: messageText };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);
    
    // Simulated network delay and AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        type: 'ai', 
        text: 'I am currently operating in offline simulation mode. But when my /api/chat route is connected, I will process your request directly!' 
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div>
      <h1 className="page-title">AI Assistant</h1>
      
      <div className="chat-container">
        <div className="chat-history">
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              {msg.type === 'ai' && (
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px', borderRadius: '50%', display: 'flex', flexShrink: 0 }}>
                  <Bot size={20} />
                </div>
              )}
              <div className={`chat-bubble ${msg.type}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '48px' }}>
              AI is typing...
            </div>
          )}
        </div>
        
        <div className="chat-input-wrapper">
          <div className="quick-actions" style={{ marginBottom: '12px' }}>
            {prompts.map((p, i) => (
              <button key={i} className="quick-action-btn" onClick={() => handleSend(p)}>
                ✨ {p}
              </button>
            ))}
          </div>

          <div className="chat-input-row" style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              className="chat-input" 
              placeholder="Ask me to draft an email, check tasks, or search threads..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isTyping}
            />
            <button className="chat-send-btn" onClick={() => handleSend()} disabled={isTyping} style={{ opacity: isTyping ? 0.5 : 1 }}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
