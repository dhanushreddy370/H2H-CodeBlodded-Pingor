import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, AtSign, Paperclip, X, Bot, User, Minimize2, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FloatingChat = ({ isOpen, onClose, chatId, initialContext }) => {
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: "Hello! I am Pingor, your AI communication assistant. How can I help you today?" }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [paletteType, setPaletteType] = useState(null); 
  const [paletteSearch, setPaletteSearch] = useState('');
  const [contextChips, setContextChips] = useState([]); 
  const [filteredOptions, setFilteredOptions] = useState([]);
  
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
      fetch(`http://localhost:5000/api/tasks?userId=${user.id}`).then(r => r.json()).then(setTasks).catch(console.error);
      fetch(`http://localhost:5000/api/followups?userId=${user.id}`).then(r => r.json()).then(setFollowUps).catch(console.error);
      
      if (chatId) {
        loadSession(chatId);
      } else if (initialContext) {
        // Automatically add the thread context as a chip
        setContextChips([{
          id: initialContext.threadId,
          label: initialContext.subject,
          type: 'followup',
          icon: <Paperclip size={14}/>
        }]);
        
        setMessages([
          { id: 1, role: 'assistant', text: `Hi! I'm ready to help you analyze this thread from ${initialContext.sender}.` },
          { id: 2, role: 'assistant', text: "How would you like to respond?" }
        ]);
      } else {
        setMessages([
          { id: 1, role: 'assistant', text: "Hello! I am Pingor, your AI communication assistant. How can I help you today?" }
        ]);
      }
    }
  }, [isOpen, chatId, user, initialContext]);

  const loadSession = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/history/${id}`);
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
    
    try {
      // 1. Get/Create Session
      let sessionId = currentChatId;
      if (!sessionId && userId) {
        const sessionRes = await fetch('http://localhost:5000/api/history', {
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
        // Save user message to existing session
        await fetch(`http://localhost:5000/api/history/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'user', content: userText })
        });
      }

      // 2. Call AI for response
      const response = await fetch('http://localhost:5000/api/chat/ask', {
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

      // 3. Save AI response to session
      if (sessionId) {
        await fetch(`http://localhost:5000/api/history/${sessionId}/messages`, {
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
        text: "Sorry, I'm having trouble connecting to my local brain. Please check if Ollama is running." 
      }]);
    }
  };

  if (!isOpen) return null;

  const quickPrompts = [
    { label: "Summarize Day", icon: <Sparkles size={14}/> },
    { label: "Draft Reply", icon: <Bot size={14}/> },
    { label: "Urgent Emails", icon: <Sparkles size={14}/> }
  ];


  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '24px', 
      right: '24px', 
      width: '800px', 
      height: isMinimized ? '70px' : '750px', 
      maxHeight: 'calc(100vh - 48px)',
      background: 'var(--bg-card)', 
      borderRadius: '24px', 
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)', 
      display: 'flex', 
      flexDirection: 'column', 
      zIndex: 1000, 
      border: '1px solid var(--border)',
      overflow: 'hidden',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            // Simplified: Add a chip to context to show it's "attached"
            setContextChips([...contextChips, { id: Date.now(), label: file.name, type: 'file', icon: <Paperclip size={14}/> }]);
          }
        }}
      />
      {/* ... rest of existing header ... */}
      {/* Header */}
      <div style={{ 
        background: 'var(--bg-card)', 
        color: 'var(--text-main)', 
        padding: '12px 24px', 
        borderBottom: isMinimized ? 'none' : '1px solid var(--border)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        cursor: 'pointer',
        minHeight: '70px'
      }} onClick={() => isMinimized && setIsMinimized(false)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="icon-container" style={{ background: 'var(--primary)', color: 'white', width: '36px', height: '36px' }}>
            <Bot size={20} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Pingor Intelligence</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isMinimized ? 'Minimized' : 'Local AI Model • Ollama'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="icon-container" 
               style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
               onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
            <Minimize2 size={18} style={{ transform: isMinimized ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </div>
          <div className="icon-container" 
               style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
               onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <X size={20} />
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="chat-history" style={{ flex: 1, padding: '16px', overflowY: 'auto', background: 'var(--bg-primary)' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div className="icon-container" style={{ background: msg.role === 'user' ? 'var(--primary)' : 'var(--primary-light)', color: msg.role === 'user' ? 'white' : 'var(--primary)', width: '32px', height: '32px' }}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div className={`chat-bubble ${msg.role}`} style={{ 
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px 14px',
                lineHeight: '1.5',
                fontSize: '0.9rem'
              }}>
                {msg.text}
                {msg.chips && msg.chips.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {msg.chips.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem' }}>
                        {c.icon} <span style={{marginLeft: '4px'}}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ 
        padding: '24px', 
        background: 'var(--bg-card)', 
        borderTop: '1px solid var(--border)', 
        position: 'relative' 
      }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {quickPrompts.map((p, i) => (
            <button 
              key={i} 
              onClick={() => { setInputVal(p.label); inputRef.current?.focus(); }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '8px 16px', 
                borderRadius: 'var(--radius-full)', 
                border: '1px solid var(--border)',
                background: 'transparent',
                fontSize: '0.8rem',
                color: 'var(--text-main)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {p.icon}
              {p.label}
            </button>
          ))}
        </div>
        {showCommandPalette && (
          <div className="card" style={{ position: 'absolute', bottom: '100%', left: 0, width: '100%', marginBottom: '8px', padding: '8px', zIndex: 100, maxHeight: '200px', overflowY: 'auto', borderRadius: '12px' }}>
            <div style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {paletteType === 'slash' ? 'Commands' : `Select ${paletteType}`}
            </div>
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div key={opt.id} onClick={() => selectOption(opt)} className="nav-item" style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                <div className="icon-container" style={{ width: '20px', height: '20px' }}>{opt.icon}</div>
                {opt.label}
              </div>
            )) : (
              <div style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No results found</div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {contextChips.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', paddingBottom: '8px', flexWrap: 'wrap' }}>
              {contextChips.map(chip => (
                <div key={chip.id} className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem' }}>
                  {chip.icon}
                  {chip.label}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeChip(chip.id)} />
                </div>
              ))}
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="icon-container" 
              onClick={() => fileInputRef.current?.click()}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)' }}
              title="Attach media or files"
            >
              <Paperclip size={18} />
            </button>
            <input 
              ref={inputRef}
              type="text" 
              className="chat-input"
              value={inputVal}
              onChange={handleInputChange}
              placeholder="Ask Pingor... Use / or @"
              style={{ border: 'none', boxShadow: 'none', flex: 1, padding: '8px 0', fontSize: '0.9rem', outline: 'none', background: 'transparent' }}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            />
            <button className="button" onClick={sendMessage} style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={14} />
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
