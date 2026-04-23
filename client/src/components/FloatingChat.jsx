import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, AtSign, Paperclip, X, Bot, User, Minimize2, Sparkles, Trash2, Cpu, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

const FloatingChat = ({ isOpen, onClose, chatId, initialContext }) => {
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: "Hello! I am Pingor, your AI communication assistant. I can help you summarize threads, draft replies, or manage your tasks. How can I help you today?" }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [paletteType, setPaletteType] = useState(null); 
  const [paletteSearch, setPaletteSearch] = useState('');
  const [contextChips, setContextChips] = useState([]); 
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const [tasks, setTasks] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && user?.id) {
      scrollToBottom();
      fetch(`${API_BASE}/api/tasks?userId=${user.id}`).then(r => r.json()).then(setTasks).catch(console.error);
      fetch(`${API_BASE}/api/followups?userId=${user.id}`).then(r => r.json()).then(setFollowUps).catch(console.error);
      
      if (chatId) {
        loadSession(chatId);
      } else if (initialContext) {
        setContextChips([{
          id: initialContext.threadId,
          label: initialContext.subject,
          type: 'followup',
          icon: <Paperclip size={14}/>
        }]);
        
        setMessages([
          { id: 1, role: 'assistant', text: `Hi! I've loaded the context for "${initialContext.subject}". I'm ready to help you analyze this thread from ${initialContext.sender}.` },
          { id: 2, role: 'assistant', text: "How would you like to proceed? I can draft a reply or summarize the key points." }
        ]);
      }
    }
  }, [isOpen, chatId, user, initialContext]);

  const loadSession = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/history/${id}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages.map(m => ({ id: Date.now() + Math.random(), role: m.role, text: m.content })));
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);

    if (val.endsWith('/')) {
      setShowCommandPalette(true);
      setPaletteType('slash');
      setPaletteSearch('');
    } else if (val.endsWith('@')) {
      setShowCommandPalette(true);
      setPaletteType('sender');
      setPaletteSearch('');
    } else if (showCommandPalette) {
      const parts = val.split(/[\/\@]/);
      const lastWord = parts[parts.length - 1];
      setPaletteSearch(lastWord);
      
      if (paletteType === 'slash') {
        if (lastWord.toLowerCase().startsWith('t')) setPaletteType('task');
        if (lastWord.toLowerCase().startsWith('f')) setPaletteType('followup');
      }
    } else {
      setShowCommandPalette(false);
    }
  };

  useEffect(() => {
    if (!showCommandPalette) return;
    
    let options = [];
    if (paletteType === 'task') {
      options = tasks.map(t => ({ id: t._id, label: t.action, type: 'task', icon: <Hash size={14}/> }));
    } else if (paletteType === 'followup') {
      options = followUps.map(f => ({ id: f._id || f.threadId, label: f.subject, type: 'followup', icon: <Paperclip size={14}/> }));
    } else if (paletteType === 'sender') {
      const senders = [...new Set([...tasks.map(t=>t.sender), ...followUps.map(f=>f.sender)].filter(Boolean))];
      options = senders.map(s => ({ id: s, label: s, type: 'sender', icon: <AtSign size={14}/> }));
    } else if (paletteType === 'slash') {
      options = [
        { id: 'opt_t', label: 'Attach Task', type: 'select_mode', mode: 'task', icon: <Hash size={14}/> },
        { id: 'opt_f', label: 'Attach Follow-up', type: 'select_mode', mode: 'followup', icon: <Paperclip size={14}/> }
      ];
    }
    
    if (paletteSearch && paletteType !== 'slash') {
      options = options.filter(o => o.label.toLowerCase().includes(paletteSearch.toLowerCase()));
    }
    setFilteredOptions(options);
  }, [paletteType, paletteSearch, tasks, followUps, showCommandPalette]);

  const selectOption = (opt) => {
    if (opt.type === 'select_mode') {
      setPaletteType(opt.mode);
      return;
    }
    
    if (opt.type === 'sender') {
      const newVal = inputVal.replace(/\@[^\@]*$/, `@${opt.id} `);
      setInputVal(newVal);
    } else {
      if (!contextChips.find(c => c.id === opt.id)) {
        setContextChips([...contextChips, opt]);
      }
      const newVal = inputVal.replace(/\/[^\/]*$/, '');
      setInputVal(newVal);
    }
    setShowCommandPalette(false);
    inputRef.current?.focus();
  };

  const removeChip = (id) => {
    setContextChips(contextChips.filter(c => c.id !== id));
  };

  const [currentChatId, setCurrentChatId] = useState(chatId);

  useEffect(() => {
    setCurrentChatId(chatId);
  }, [chatId]);

  const sendMessage = async () => {
    if (!inputVal.trim() && contextChips.length === 0) return;
    
    const userId = user?.id || user?.sub;
    const userText = inputVal;
    const userMsg = { id: Date.now(), role: 'user', text: userText, chips: [...contextChips] };
    
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setContextChips([]);
    setShowCommandPalette(false);
    setIsTyping(true);
    
    setTimeout(scrollToBottom, 100);

    try {
      let sessionId = currentChatId;
      if (!sessionId && userId) {
        const sessionRes = await fetch(`${API_BASE}/api/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId, 
            title: userText.substring(0, 30) || 'New Conversation',
            initialMessage: { role: 'user', content: userText }
          })
        });
        const sessionData = await sessionRes.json();
        sessionId = sessionData._id;
        setCurrentChatId(sessionId);
      } else if (sessionId) {
        await fetch(`${API_BASE}/api/history/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'user', content: userText })
        });
      }

      const response = await fetch(`${API_BASE}/api/chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: userText }
          ]
        })
      });
      
      const data = await response.json();
      const aiText = data.text;
      
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: aiText 
      }]);

      if (sessionId) {
        await fetch(`${API_BASE}/api/history/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'assistant', content: aiText })
        });
      }

    } catch(err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: "I'm having trouble reaching my local intelligence engine. Please ensure Ollama is running on your machine." 
      }]);
    } finally {
      setIsTyping(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  if (!isOpen) return null;

  const quickPrompts = [
    { label: "Summarize my day", icon: <Sparkles size={14}/> },
    { label: "Draft a follow-up", icon: <Bot size={14}/> },
    { label: "Show urgent tasks", icon: <Zap size={14}/> }
  ];

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '24px', 
      right: '24px', 
      width: '420px', 
      height: isMinimized ? '70px' : '650px', 
      maxHeight: 'calc(100vh - 48px)',
      background: 'white', 
      borderRadius: '28px', 
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
      display: 'flex', 
      flexDirection: 'column', 
      zIndex: 1000, 
      border: '1px solid rgba(0,0,0,0.08)',
      overflow: 'hidden',
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            setContextChips([...contextChips, { id: Date.now(), label: file.name, type: 'file', icon: <Paperclip size={14}/> }]);
          }
        }}
      />
      
      {/* Header */}
      <div style={{ 
        background: 'white', 
        padding: '16px 24px', 
        borderBottom: isMinimized ? 'none' : '1px solid rgba(0,0,0,0.05)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        cursor: 'pointer',
        minHeight: '70px'
      }} onClick={() => isMinimized && setIsMinimized(false)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="icon-container" style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
            <Bot size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '900', fontSize: '1.05rem', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>Pingor AI</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></div>
              Local Engine Online
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
               className="icon-container-hover" 
               style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }} 
               onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
            <Minimize2 size={18} style={{ transform: isMinimized ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>
          <button 
               className="icon-container-hover" 
               style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }} 
               onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <X size={20} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="chat-history" style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#fcfdfe', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '10px', 
                  background: msg.role === 'user' ? 'var(--primary)' : 'white', 
                  color: msg.role === 'user' ? 'white' : 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  flexShrink: 0
                }}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{ 
                    background: msg.role === 'user' ? 'var(--primary)' : 'white',
                    color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                    boxShadow: msg.role === 'user' ? '0 4px 12px rgba(37,99,235,0.2)' : '0 2px 10px rgba(0,0,0,0.03)',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(0,0,0,0.05)',
                    borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    padding: '14px 18px',
                    lineHeight: '1.6',
                    fontSize: '0.92rem',
                    fontWeight: 500
                  }}>
                    {msg.text}
                    {msg.chips && msg.chips.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {msg.chips.map(c => (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.08)', padding: '4px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {c.icon} <span style={{marginLeft: '6px'}}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <Bot size={18} />
                </div>
                <div style={{ background: 'white', padding: '12px 18px', borderRadius: '20px 20px 20px 4px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', gap: '4px' }}>
                  <div className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }}></div>
                  <div className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', animationDelay: '0.2s' }}></div>
                  <div className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '24px', background: 'white', borderTop: '1px solid rgba(0,0,0,0.05)', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
              {quickPrompts.map((p, i) => (
                <button 
                  key={i} 
                  onClick={() => { setInputVal(p.label); inputRef.current?.focus(); }}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', 
                    borderRadius: '14px', border: '1px solid #f1f5f9', background: '#f8fafc',
                    fontSize: '0.8rem', color: '#475569', fontWeight: 700, cursor: 'pointer',
                    whiteSpace: 'nowrap', transition: 'all 0.2s'
                  }}
                  className="quick-prompt-btn"
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>

            {showCommandPalette && (
              <div style={{ position: 'absolute', bottom: '100%', left: '20px', right: '20px', marginBottom: '16px', background: 'white', borderRadius: '20px', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden', zIndex: 100, maxHeight: '250px', overflowY: 'auto' }}>
                <div style={{ padding: '12px 20px', fontSize: '0.7rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', background: '#f8fafc' }}>
                  {paletteType === 'slash' ? 'Pingor Commands' : `Select ${paletteType}`}
                </div>
                <div style={{ padding: '8px' }}>
                  {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                    <div key={opt.id} onClick={() => selectOption(opt)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} className="palette-item">
                      <div style={{ color: 'var(--primary)' }}>{opt.icon}</div>
                      {opt.label}
                    </div>
                  )) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No results matched</div>
                  )}
                </div>
              </div>
            )}

            <div style={{ background: '#f1f5f9', borderRadius: '20px', padding: '8px' }}>
              {contextChips.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', padding: '8px', flexWrap: 'wrap' }}>
                  {contextChips.map(chip => (
                    <div key={chip.id} style={{ background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      {chip.icon}
                      <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chip.label}</span>
                      <X size={14} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => removeChip(chip.id)} />
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px' }}>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  title="Attach context"
                >
                  <Paperclip size={20} />
                </button>
                <input 
                  ref={inputRef}
                  type="text" 
                  value={inputVal}
                  onChange={handleInputChange}
                  placeholder="Ask Pingor... (Try / for commands)"
                  style={{ border: 'none', background: 'transparent', flex: 1, padding: '10px 0', fontSize: '0.95rem', fontWeight: 500, outline: 'none', color: '#1e293b' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                />
                <button 
                  onClick={sendMessage} 
                  style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FloatingChat;

