import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, AtSign, Paperclip, X, Bot, User } from 'lucide-react';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: "Hello Rithika! I am Pingor, your AI communication assistant. I've analyzed your inbox and I'm ready to help. You can ask me to summarize threads, draft replies, or filter tasks using context." }
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetch('http://localhost:5000/api/tasks').then(r => r.json()).then(setTasks).catch(console.error);
    fetch('http://localhost:5000/api/followups').then(r => r.json()).then(setFollowUps).catch(console.error);
  }, []);

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

  const sendMessage = async () => {
    if (!inputVal.trim() && contextChips.length === 0) return;
    
    const userMsg = { id: Date.now(), role: 'user', text: inputVal, chips: [...contextChips] };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setContextChips([]);
    setShowCommandPalette(false);
    
    try {
      // Simulate AI processing
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          role: 'assistant', 
          text: `I've received your request about "${userMsg.text}". I am analyzing the ${userMsg.chips.length} attached items to provide the best assistance. \n\nBased on your history, I recommend drafting an update for the budget review first.` 
        }]);
      }, 1000);
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="chat-page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '900px', margin: '0 auto', paddingBottom: '20px' }}>
      <div className="chat-history" style={{ flex: 1, padding: '20px 0' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div className="icon-container" style={{ background: msg.role === 'user' ? 'var(--primary)' : 'var(--primary-light)', color: msg.role === 'user' ? 'white' : 'var(--primary)', width: '40px', height: '40px' }}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div className={`chat-bubble ${msg.role}`} style={{ 
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                boxShadow: 'var(--shadow)',
                borderRadius: '16px',
                padding: '16px 20px',
                lineHeight: '1.6'
              }}>
                {msg.text}
                {msg.chips && msg.chips.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {msg.chips.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.1)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '600' }}>
                        {c.icon} <span style={{marginLeft: '4px'}}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                {msg.role === 'assistant' ? 'Pingor AI' : 'You'} &bull; Just now
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-section" style={{ position: 'relative', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-hover)', padding: '8px' }}>
        {showCommandPalette && (
          <div className="card" style={{ position: 'absolute', bottom: '100%', left: 0, width: '100%', marginBottom: '12px', padding: '8px', zIndex: 100, maxHeight: '300px', overflowY: 'auto' }}>
            <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {paletteType === 'slash' ? 'Commands' : `Select ${paletteType}`}
            </div>
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div key={opt.id} onClick={() => selectOption(opt)} className="nav-item" style={{ padding: '10px 16px', borderRadius: '8px' }}>
                <div className="icon-container" style={{ width: '24px', height: '24px' }}>{opt.icon}</div>
                {opt.label}
              </div>
            )) : (
              <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No results found</div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {contextChips.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', padding: '8px 12px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
              {contextChips.map(chip => (
                <div key={chip.id} className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}>
                  {chip.icon}
                  {chip.label}
                  <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeChip(chip.id)} />
                </div>
              ))}
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px' }}>
            <Paperclip size={20} className="icon-container" style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
            <input 
              ref={inputRef}
              type="text" 
              className="chat-input"
              value={inputVal}
              onChange={handleInputChange}
              placeholder="Ask Pingor, use / for context or @ for people..."
              style={{ border: 'none', boxShadow: 'none', padding: '12px 0' }}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            />
            <button className="button" onClick={sendMessage} style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
