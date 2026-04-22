import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, User, MessageCircle, Paperclip, CheckCircle, Clock, Trash2, Send, Plus, Archive, ChevronDown, AtSign } from 'lucide-react';
import '../styles/UniversalModal.css';
import { useAuth } from '../context/AuthContext';

const DetailModal = ({ isOpen, onClose, data, onUpdate, type = 'task' }) => {
  const { user } = useAuth();
  const [activeData, setActiveData] = useState(data);
  const [commentText, setCommentText] = useState('');
  const [contacts, setContacts] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    setActiveData(data || {});
    if (isOpen) {
      document.body.classList.add('modal-open');
      const contentArea = document.querySelector('.content-area');
      if (contentArea) contentArea.style.overflow = 'hidden';
      const userId = user?.userId || user?.id || user?.sub || 'test-user-id';
      fetch(`http://localhost:5000/api/contacts?userId=${userId}`)
        .then(r => r.json())
        .then(setContacts)
        .catch(console.error);
    } else {
      document.body.classList.remove('modal-open');
      const contentArea = document.querySelector('.content-area');
      if (contentArea) contentArea.style.overflow = 'auto';
    }
    
    return () => {
      document.body.classList.remove('modal-open');
      const contentArea = document.querySelector('.content-area');
      if (contentArea) contentArea.style.overflow = 'auto';
    };
  }, [data, isOpen]);

  if (!isOpen || !activeData) return null;

  const getApiPath = () => type === 'task' ? 'tasks' : 'followups';

  const autosave = async (updatedFields) => {
    const isNew = !activeData.id && !activeData._id;
    const currentData = { ...activeData, ...updatedFields };
    const userId = user?.userId || user?.id || user?.sub || 'test-user-id';
    
    try {
      let res;
      if (isNew) {
        res = await fetch(`http://localhost:5000/api/${getApiPath()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...currentData, userId })
        });
      } else {
        res = await fetch(`http://localhost:5000/api/${getApiPath()}/${activeData._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields)
        });
      }
      
      if (res.ok) {
        const saved = await res.json();
        setActiveData(saved);
        onUpdate(saved);
      }
    } catch (err) {
      console.error('Autosave failed:', err);
    }
  };

  const handleStatusToggle = () => {
    const newStatus = activeData.status === 'done' ? 'pending' : 'done';
    autosave({ status: newStatus });
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const newComment = { text: commentText, author: 'You', createdAt: new Date() };
    const updatedComments = [...(activeData.comments || []), newComment];
    setCommentText('');
    autosave({ comments: updatedComments });
  };

  const handleAssignContact = (contact) => {
    const existing = activeData.assignees || [];
    if (existing.find(c => c.email === contact.email)) {
        setShowAssigneePicker(false);
        setAssigneeSearch('');
        return;
    }
    autosave({ assignees: [...existing, { _id: contact._id || contact.id, name: contact.name, email: contact.email }] });
    setShowAssigneePicker(false);
    setAssigneeSearch('');
  };

  const handleAddByEmail = async () => {
    const email = assigneeSearch.trim();
    if (!email || !email.includes('@')) return;

    const existingInContacts = contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (existingInContacts) {
        handleAssignContact(existingInContacts);
        return;
    }

    // Create a new contact automatically if email is not found
    const userId = user?.userId || user?.id || user?.sub || 'test-user-id';
    try {
        const res = await fetch('http://localhost:5000/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: email.split('@')[0], email, userId })
        });
        const newContact = await res.json();
        setContacts([...contacts, newContact]);
        handleAssignContact(newContact);
    } catch (err) {
        console.error('Failed to create shadow contact:', err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const newAttachment = { name: file.name, size: file.size, type: file.type };
    const updated = [...(activeData.attachments || []), newAttachment];
    autosave({ attachments: updated });
  };

  const syncWithGmail = async (action) => {
    if (!activeData.threadId) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/threads/${activeData.threadId}/sync-gmail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const result = await res.json();
      if (action === 'trash') onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(assigneeSearch.toLowerCase()) || 
    c.email.toLowerCase().includes(assigneeSearch.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <div 
              onClick={handleStatusToggle}
              style={{ 
                width: '28px', height: '28px', borderRadius: '8px', 
                border: '2px solid var(--primary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: activeData.status === 'done' ? 'var(--primary)' : 'transparent',
                color: 'white'
              }}
            >
              {activeData.status === 'done' && <CheckCircle size={18} />}
            </div>
            <input 
                value={activeData.action || activeData.subject || ''}
                placeholder="Item Title..."
                onChange={(e) => setActiveData({...activeData, action: e.target.value})}
                onBlur={(e) => autosave({ action: e.target.value })}
                className="modal-title-input"
                style={{ 
                    background: 'transparent', border: 'none', color: 'var(--text-main)',
                    fontSize: '1.5rem', fontWeight: 800, width: '100%', outline: 'none'
                }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="icon-container" onClick={onClose} style={{ cursor: 'pointer' }}><X size={24} /></div>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-left">
            <div className="modal-section">
              <div className="modal-section-title"><MessageCircle size={20} /> Description</div>
              <textarea 
                value={activeData.description || activeData.snippet || ''}
                placeholder="Add more details about this task..."
                onChange={(e) => setActiveData({...activeData, description: e.target.value})}
                onBlur={(e) => autosave({ description: e.target.value })}
                style={{ 
                    padding: '20px', background: 'var(--bg-primary)', borderRadius: '16px', 
                    lineHeight: '1.6', color: 'var(--text-main)', width: '100%', border: '1px solid var(--border)',
                    minHeight: '120px', resize: 'vertical', outline: 'none'
                }}
              />
            </div>

            <div className="modal-section" style={{ marginTop: '32px' }}>
              <div className="modal-section-title"><Clock size={20} /> Comments</div>
              <div className="comments-list">
                {(activeData.comments || []).map((c, i) => (
                  <div key={i} className="comment-bubble">
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--primary)' }}>{c.author}</div>
                    <div style={{ fontSize: '0.95rem' }}>{c.text}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(c.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="comment-input-area">
                <textarea 
                  placeholder="Ask a question or post an update..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none', minHeight: '80px', color: 'var(--text-main)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button className="button" onClick={handleAddComment} style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Send size={16} /> Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-right">
            <div className="card" style={{ padding: '24px', position: 'sticky', top: 0 }}>
              <div className="modal-section">
                <div className="modal-section-title"><Calendar size={20} /> Deadline</div>
                <input 
                  type="date" 
                  value={activeData.deadline ? new Date(activeData.deadline).toISOString().split('T')[0] : ''}
                  className="chat-input"
                  style={{ width: '100%', padding: '12px' }}
                  onChange={(e) => autosave({ deadline: e.target.value })}
                />
              </div>

              <div className="modal-section" style={{ marginTop: '24px' }}>
                <div className="modal-section-title"><User size={20} /> Assignees</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {(activeData.assignees || []).map(u => (
                    <div key={u.id || u.email} className="user-tag">{u.name}</div>
                  ))}
                </div>
                
                <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div className="chat-input-wrapper" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', borderRadius: '12px', padding: '0 12px', border: '1px solid var(--border)' }}>
                            <AtSign size={16} color="var(--text-muted)" />
                            <input 
                                placeholder="Email or name..."
                                value={assigneeSearch}
                                onChange={e => { setAssigneeSearch(e.target.value); setShowAssigneePicker(true); }}
                                onFocus={() => setShowAssigneePicker(true)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddByEmail()}
                                style={{ width: '100%', border: 'none', background: 'transparent', padding: '10px 8px', outline: 'none', color: 'var(--text-main)', fontSize: '0.85rem' }}
                            />
                        </div>
                    </div>

                    {showAssigneePicker && assigneeSearch && (
                        <div className="card" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 100, padding: '8px', marginTop: '4px' }}>
                            {filteredContacts.length > 0 ? (
                                filteredContacts.map(c => (
                                    <div key={c.id} className="nav-item" onClick={() => handleAssignContact(c)} style={{ padding: '8px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.email}</div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }} onClick={handleAddByEmail}>
                                    Press Enter to add <b>{assigneeSearch}</b>
                                </div>
                            )}
                        </div>
                    )}
                </div>
              </div>

              <div className="modal-section" style={{ marginTop: '24px' }}>
                <div className="modal-section-title"><Paperclip size={20} /> Attachments</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(activeData.attachments || []).map((a, i) => (
                    <div key={i} className="nav-item" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '12px', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Paperclip size={14} /> {a.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{Math.round(a.size / 1024) || 24} KB</div>
                    </div>
                  ))}
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                  <button className="button-secondary" onClick={() => fileInputRef.current.click()} style={{ width: '100%' }}>
                    <Plus size={16} /> Add Attachment
                  </button>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '32px', paddingTop: '20px', display: 'flex', gap: '12px' }}>
                 <button 
                   className="icon-container" 
                   onClick={() => syncWithGmail('archive')} 
                   disabled={isSyncing || !activeData.threadId} 
                   title="Archive Gmail"
                   style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', cursor: activeData.threadId ? 'pointer' : 'not-allowed', opacity: activeData.threadId ? 1 : 0.4 }}
                 >
                   <Archive size={18} />
                 </button>
                 <button 
                   className="icon-container" 
                   onClick={() => syncWithGmail('trash')} 
                   disabled={isSyncing || !activeData.threadId} 
                   title="Trash Gmail"
                   style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: '#ef4444', cursor: activeData.threadId ? 'pointer' : 'not-allowed', opacity: activeData.threadId ? 1 : 0.4 }}
                 >
                   <Trash2 size={18} />
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
