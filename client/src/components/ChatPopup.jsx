import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Minus, Paperclip, Bot, User, Maximize2 } from 'lucide-react';

const ChatPopup = ({ isOpen, onClose, user }) => {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: `Hi ${user?.name || 'there'}! How can I help with your emails today?` }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;

  const sendMessage = async () => {
    if (!inputVal.trim()) return;
    
    const userMsg = { role: 'user', text: inputVal, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      const aiMsg = data.messages[data.messages.length - 1];
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: '32px',
      width: '380px',
      height: isMinimized ? '48px' : '500px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      transition: 'height 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--primary)',
        color: 'white',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer'
      }} onClick={() => setIsMinimized(!isMinimized)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
          <Bot size={18} /> Pingor AI
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Minus size={18} onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} />
          <X size={18} onClick={(e) => { e.stopPropagation(); onClose(); }} />
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--sidebar-hover)',
                color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                {msg.text}
              </div>
            ))}
            {loading && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pingor is thinking...</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', borderRadius: '20px', padding: '4px 12px', border: '1px solid var(--border)' }}>
              <input 
                type="text" 
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask Pingor..."
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '8px 0', fontSize: '0.9rem', color: 'var(--text-main)' }}
              />
              <button onClick={sendMessage} style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer' }}>
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPopup;
