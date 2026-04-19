import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, AtSign, Paperclip, X } from 'lucide-react';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: "Hello! I am Pingor, your AI communication assistant. How can I help you today?" }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [paletteType, setPaletteType] = useState(null); // 'task', 'followup', 'sender'
  const [paletteSearch, setPaletteSearch] = useState('');
  const [contextChips, setContextChips] = useState([]); // Selected tasks/followups to attach
  const [filteredOptions, setFilteredOptions] = useState([]);
  
  // Data lists from API
  const [tasks, setTasks] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  
  const inputRef = useRef(null);

  useEffect(() => {
    // Fetch real data to use in command palette
    fetch('http://localhost:5000/api/tasks').then(r => r.json()).then(setTasks).catch(console.error);
    fetch('http://localhost:5000/api/followups').then(r => r.json()).then(setFollowUps).catch(console.error);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);

    // Command palette logic
    if (val.endsWith('/')) {
      setShowCommandPalette(true);
      setPaletteType('slash');
      setPaletteSearch('');
    } else if (val.endsWith('@')) {
      setShowCommandPalette(true);
      setPaletteType('sender');
      setPaletteSearch('');
    } else if (showCommandPalette) {
      if (paletteType === 'task' || paletteType === 'followup' || paletteType === 'sender') {
        const lastWord = val.split(/[\/\@]/).pop();
        setPaletteSearch(lastWord);
      } else {
        // If they keep typing after slash but did not select task/followup
        const lastWord = val.split('/').pop();
        if (lastWord.toLowerCase().startsWith('t')) setPaletteType('task');
        if (lastWord.toLowerCase().startsWith('f')) setPaletteType('followup');
      }
    }
  };

  useEffect(() => {
    if (!showCommandPalette) return;
    
    let options = [];
    if (paletteType === 'task') {
      options = tasks.map(t => ({ id: t._id, label: `Task: ${t.action}`, type: 'task' }));
    } else if (paletteType === 'followup') {
      options = followUps.map(f => ({ id: f._id || f.threadId, label: `Follow-up: ${f.subject}`, type: 'followup' }));
    } else if (paletteType === 'sender') {
      // Extract unique senders
      const senders = [...new Set([...tasks.map(t=>t.sender), ...followUps.map(f=>f.sender)].filter(Boolean))];
      options = senders.map(s => ({ id: s, label: `User: ${s}`, type: 'sender' }));
    } else if (paletteType === 'slash') {
      options = [
        { id: 'opt_t', label: 'Tasks', type: 'select_mode', mode: 'task' },
        { id: 'opt_f', label: 'Follow-ups', type: 'select_mode', mode: 'followup' }
      ];
    }
    
    if (paletteSearch) {
      options = options.filter(o => o.label.toLowerCase().includes(paletteSearch.toLowerCase()));
    }
    setFilteredOptions(options);
  }, [paletteType, paletteSearch, tasks, followUps, showCommandPalette]);

  const selectOption = (opt) => {
    if (opt.type === 'select_mode') {
      setPaletteType(opt.mode);
      setInputVal(inputVal + opt.mode.charAt(0) + ' ');
      return;
    }
    
    if (opt.type === 'sender') {
      // Just append sender text
      setInputVal(inputVal.replace(/\@[^\@]*$/, `@${opt.id} `));
    } else {
      // Attach as context chip
      if (!contextChips.find(c => c.id === opt.id)) {
        setContextChips([...contextChips, opt]);
      }
      // Remove the typed command
      setInputVal(inputVal.replace(/\/[^\/]*$/, ''));
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
      // Inject context if there are chips
      let contextBlock = '';
      if (userMsg.chips.length > 0) {
        const taskIds = userMsg.chips.filter(c => c.type === 'task').map(c => c.id);
        const followUpIds = userMsg.chips.filter(c => c.type === 'followup').map(c => c.id);
        const res = await fetch('http://localhost:5000/api/chat/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskIds, followUpIds })
        });
        const data = await res.json();
        contextBlock = data.contextBlock;
      }
      
      // We simulate a response
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: `Received your message: "${userMsg.text}".\n\nContext attached:\n${contextBlock || 'None'}` }]);
      }, 1000);
      
    } catch(err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: "Error connecting to server." }]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', background: 'var(--bg-main)' }}>
      <h1 className="page-title">Pingor Chat</h1>
      
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '70%', padding: '12px 16px', borderRadius: '12px', background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-hover)', color: msg.role === 'user' ? '#fff' : 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
              {msg.text}
              {msg.chips && msg.chips.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {msg.chips.map(c => (
                    <span key={c.id} style={{ fontSize: '12px', padding: '2px 6px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
                      <Paperclip size={12} style={{marginRight: '4px'}} />
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ position: 'relative' }}>
        {showCommandPalette && (
          <div style={{ position: 'absolute', bottom: '100%', left: 0, width: '300px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '8px', zIndex: 10 }}>
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div key={opt.id} onClick={() => selectOption(opt)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                {opt.label}
              </div>
            )) : (
              <div style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>No matches found</div>
            )}
          </div>
        )}

        {contextChips.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {contextChips.map(chip => (
              <div key={chip.id} style={{ display: 'flex', alignItems: 'center', background: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '16px', fontSize: '12px' }}>
                <Paperclip size={14} style={{ marginRight: '4px' }} />
                {chip.label}
                <X size={14} style={{ marginLeft: '4px', cursor: 'pointer' }} onClick={() => removeChip(chip.id)} />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '8px 16px' }}>
          <input 
            ref={inputRef}
            type="text" 
            value={inputVal}
            onChange={handleInputChange}
            placeholder="Ask Pingor or type / to attach Task/Follow-up context, or @ for Sender..."
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '14px' }}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          />
          <button onClick={sendMessage} style={{ background: 'var(--primary)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
