import React, { useState, useEffect } from 'react';
import { Send, Bot, Paperclip } from 'lucide-react';

const Pingor = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', text: 'Hello! I am Pingor. I can draft emails, search threads, or review your tasks. Try typing "/" for commands or "@" to reference a sender!' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [contextChip, setContextChip] = useState(null);

  // Command handling state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showAtMenu, setShowAtMenu] = useState(false);

  const slashCommands = ['Task', 'Follow-up', 'Sender'];
  const mockSenders = ['Alice Smith', 'Bob Johnson', 'IT Support', 'Finance Dept'];

  // Effect to listen for command triggers
  useEffect(() => {
    // Regex/parser for \ and @ commands
    if (input.endsWith('/')) {
      setShowSlashMenu(true);
      setShowAtMenu(false);
    } else if (input.endsWith('@')) {
      setShowAtMenu(true);
      setShowSlashMenu(false);
    } else {
      if (showSlashMenu && !input.includes('/')) setShowSlashMenu(false);
      if (showAtMenu && !input.includes('@')) setShowAtMenu(false);
    }
  }, [input, showSlashMenu, showAtMenu]);

  const handleCommandSelect = (type, value) => {
    // Clear the trigger character 
    const cleanedInput = input.slice(0, -1);
    setInput(cleanedInput);
    
    // Inject selected item as context
    setContextChip({ type, value });
    
    setShowSlashMenu(false);
    setShowAtMenu(false);
  };

  const handleSend = async (textOveride) => {
    const messageText = textOveride || input;
    if (!messageText.trim() && !contextChip) return;
    
    // Prepare prompt payload with context injection
    const payloadPrompt = contextChip ? `[Context: ${contextChip.type} - ${contextChip.value}] ${messageText}` : messageText;
    
    const newMsg = { id: Date.now(), type: 'user', text: payloadPrompt, context: contextChip };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setContextChip(null);
    setIsTyping(true);
    
    // Simulated backend agent interaction
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        type: 'ai', 
        text: `Understood! Let me analyze ${contextChip ? contextChip.value : 'that'} for you.` 
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chat-container" style={{ flex: 1, border: 'none', borderRadius: '16px 16px 0 0' }}>
        <div className="chat-history" style={{ padding: '40px 15%' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              {msg.type === 'ai' && (
                <div style={{ background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '50%', display: 'flex', flexShrink: 0 }}>
                  <Bot size={24} />
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.context && (
                  <div style={{ background: 'var(--table-header)', border: '1px solid var(--border)', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '12px', marginBottom: '8px', color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Paperclip size={12} /> {msg.context.type}: {msg.context.value}
                  </div>
                )}
                <div className={`chat-bubble ${msg.type}`} style={{ fontSize: '1.05rem', padding: '16px 20px', borderRadius: '20px', maxWidth: '100%' }}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginLeft: '60px' }}>Pingor is thinking...</div>
          )}
        </div>
        
        <div style={{ padding: '0 15% 32px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            
            {showSlashMenu && (
              <div style={{ position: 'absolute', bottom: '100%', left: '0', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', marginBottom: '8px', boxShadow: 'var(--shadow-hover)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', padding: '4px' }}>COMMANDS</div>
                {slashCommands.map(cmd => (
                  <div key={cmd} onClick={() => handleCommandSelect('Command', cmd)} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '6px', color: 'var(--text-main)' }} onMouseEnter={e => e.target.style.background = 'var(--sidebar-hover)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                    🗂️ {cmd}
                  </div>
                ))}
              </div>
            )}

            {showAtMenu && (
              <div style={{ position: 'absolute', bottom: '100%', left: '0', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', marginBottom: '8px', boxShadow: 'var(--shadow-hover)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', padding: '4px' }}>SENDERS</div>
                {mockSenders.map(sender => (
                  <div key={sender} onClick={() => handleCommandSelect('Sender', sender)} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '6px', color: 'var(--text-main)' }} onMouseEnter={e => e.target.style.background = 'var(--sidebar-hover)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                    👤 {sender}
                  </div>
                ))}
              </div>
            )}

            {contextChip && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: '16px', width: 'max-content', marginBottom: '12px', color: 'var(--primary)', fontSize: '0.85rem' }}>
                <Paperclip size={14} /> Attached Context: {contextChip.type} - {contextChip.value}
                <span onClick={() => setContextChip(null)} style={{ cursor: 'pointer', marginLeft: '8px', fontWeight: 'bold' }}>✕</span>
              </div>
            )}

            <div className="chat-input-row" style={{ display: 'flex', gap: '12px', background: 'var(--bg-card)', padding: '12px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              <input 
                type="text" 
                autoFocus
                placeholder="Message Pingor... (type / or @ for context injection)" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={isTyping}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '0 12px', color: 'var(--text-main)', fontSize: '1rem' }}
              />
              <button 
                onClick={() => handleSend()} 
                disabled={isTyping || (!input.trim() && !contextChip)} 
                style={{ background: (input.trim() || contextChip) ? 'var(--primary)' : 'var(--border)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Send size={18} style={{ transform: 'translateX(-1px) translateY(1px)' }} />
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '12px' }}>Pingor can make mistakes. Consider verifying important actions.</div>
        </div>
      </div>
    </div>
  );
};

export default Pingor;
