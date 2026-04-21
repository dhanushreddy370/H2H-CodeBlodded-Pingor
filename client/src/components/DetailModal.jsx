import React, { useState, useEffect } from 'react';
import { X, Calendar, User, MessageCircle, Paperclip, CheckCircle, Clock, Trash2, Send, Plus } from 'lucide-react';
import '../styles/UniversalModal.css';

const DetailModal = ({ isOpen, onClose, data, onUpdate }) => {
  const [activeData, setActiveData] = useState(data);
  const [commentText, setCommentText] = useState('');
  const [users, setUsers] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setActiveData(data);
    if (isOpen) {
      fetch('http://localhost:5000/api/users').then(r => r.json()).then(setUsers);
    }
  }, [data, isOpen]);

  if (!isOpen || !activeData) return null;

  const handleStatusToggle = async () => {
    const newStatus = activeData.status === 'done' ? 'pending' : 'done';
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${activeData._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const updated = await res.json();
      setActiveData(updated);
      onUpdate(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const newComment = { text: commentText, author: 'You', createdAt: new Date() };
    const updatedData = { ...activeData, comments: [...(activeData.comments || []), newComment] };
    
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${activeData._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      setActiveData(data);
      setCommentText('');
      onUpdate(data);
    } catch (err) {
      console.error(err);
    }
  };

  const syncWithGmail = async (action) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/threads/${activeData.threadId}/sync-gmail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const result = await res.json();
      alert(result.message); // Simple alert for now, can be a toast
      if (action === 'trash') onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{activeData.action || activeData.subject}</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="button-secondary" onClick={() => syncWithGmail('archive')} disabled={isSyncing}>Archive Gmail</button>
            <button className="button-secondary" style={{ color: '#ef4444' }} onClick={() => syncWithGmail('trash')} disabled={isSyncing}>Trash Gmail</button>
            <div className="icon-container" onClick={onClose} style={{ cursor: 'pointer' }}><X size={24} /></div>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-left">
            <div className="modal-section">
              <div className="modal-section-title"><MessageCircle size={20} /> Description</div>
              <div style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: '16px', lineHeight: '1.6', color: 'var(--text-main)' }}>
                {activeData.snippet || "No additional description provided."}
              </div>
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
                  style={{ width: '100%' }}
                  onChange={async (e) => {
                    const d = { ...activeData, deadline: e.target.value };
                    setActiveData(d);
                    onUpdate(d);
                    // Save to DB here...
                  }}
                />
              </div>

              <div className="modal-section" style={{ marginTop: '24px' }}>
                <div className="modal-section-title"><User size={20} /> Assignees</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(activeData.assignees || []).map(u => (
                    <div key={u._id} className="user-tag">{u.name}</div>
                  ))}
                  <div className="icon-container" style={{ cursor: 'pointer', border: '1px dashed var(--border)', background: 'transparent' }}>
                    <Plus size={16} />
                  </div>
                </div>
              </div>

              <div className="modal-section" style={{ marginTop: '24px' }}>
                <div className="modal-section-title"><Paperclip size={20} /> Attachments</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(activeData.attachments || []).map((a, i) => (
                    <div key={i} className="nav-item" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <Paperclip size={14} /> {a.name}
                    </div>
                  ))}
                  <button className="button-secondary" style={{ width: '100%' }}>
                    <Plus size={16} /> Add Attachment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
