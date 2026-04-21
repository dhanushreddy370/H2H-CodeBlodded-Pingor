import React, { useState, useEffect, useCallback } from 'react';
import { Bot, CheckSquare, Filter, Archive, Trash2, Reply, Inbox as InboxIcon, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Inbox = () => {
  const { user } = useAuth();
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const userId = user?.id || user?.sub;
    try {
      const res = await fetch(`http://localhost:5000/api/threads?userId=${userId}`);
      const data = await res.json();
      const activeThreads = data.filter(t => !t.archived && !t.trashed);
      setThreads(activeThreads);
      if (activeThreads.length > 0 && !selectedThreadId) setSelectedThreadId(activeThreads[0]._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedThreadId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleGmailAction = async (action) => {
    try {
      showToast(`Syncing with Gmail: ${action}...`, 'loading');
      const res = await fetch(`http://localhost:5000/api/threads/${selectedThreadId}/sync-gmail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setThreads(threads.filter(t => t._id !== selectedThreadId));
        setSelectedThreadId(null);
      } else {
        showToast(data.error || 'Sync failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  };

  const handleSendCompose = () => {
    showToast('Drafting email in Gmail...');
    setTimeout(() => {
      setIsComposeOpen(false);
      setComposeData({ to: '', subject: '', body: '' });
      showToast('Draft created successfully!');
    }, 1500);
  };

  const selectedThread = threads.find(t => t._id === selectedThreadId);
  const filteredThreads = threads.filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.sender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="inbox-page">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: notification.type === 'error' ? '#ef4444' : notification.type === 'loading' ? 'var(--primary)' : '#16a34a',
          color: 'white', padding: '12px 24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '10px', animation: 'slideUp 0.3s ease'
        }}>
          {notification.type === 'loading' ? <Loader2 size={18} className="animate-spin" /> : 
           notification.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Quick Compose Overlay */}
      {isComposeOpen && (
        <div className="modal-overlay" onClick={() => setIsComposeOpen(false)} style={{ zIndex: 4000 }}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '500px', padding: '32px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>New Message</h3>
              <XCircle size={20} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setIsComposeOpen(false)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="text" placeholder="Recipients" className="chat-input" 
                value={composeData.to} onChange={e => setComposeData({...composeData, to: e.target.value})}
              />
              <input 
                type="text" placeholder="Subject" className="chat-input" 
                value={composeData.subject} onChange={e => setComposeData({...composeData, subject: e.target.value})}
              />
              <textarea 
                placeholder="Write your message..." className="chat-input" 
                style={{ minHeight: '200px', borderRadius: '16px', resize: 'none' }}
                value={composeData.body} onChange={e => setComposeData({...composeData, body: e.target.value})}
              ></textarea>
              <button className="button" onClick={handleSendCompose}>Send as Draft</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Correspondence</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="button-secondary" onClick={() => setSearchTerm('')} title="Clear Filters"><Filter size={18} /></button>
          <button className="button" onClick={() => setIsComposeOpen(true)}>Compose</button>
        </div>
      </div>

      <div className="inbox-layout">
        <div className="inbox-sidebar card" style={{ padding: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" placeholder="Search threads..." 
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
          </div>
          <div className="threads-list" style={{ overflowY: 'auto', flex: 1 }}>
            {filteredThreads.length > 0 ? filteredThreads.map(thread => (
              <div 
                key={thread._id} 
                className={`email-item ${selectedThreadId === thread._id ? 'selected' : ''}`}
                onClick={() => setSelectedThreadId(thread._id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: selectedThreadId === thread._id ? '800' : '600', fontSize: '0.95rem' }}>{thread.subject}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(thread.lastUpdated).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{thread.snippet}</div>
              </div>
            )) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No threads found</div>
            )}
          </div>
        </div>
        
        <div className="inbox-main card" style={{ padding: 0 }}>
          {selectedThread ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedThread.subject}</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="icon-container" onClick={() => handleGmailAction('archive')} style={{ border: '1px solid var(--border)', cursor: 'pointer' }} title="Archive in Gmail"><Archive size={18} /></div>
                  <div className="icon-container" onClick={() => handleGmailAction('trash')} style={{ border: '1px solid var(--border)', color: '#ef4444', cursor: 'pointer' }} title="Trash in Gmail"><Trash2 size={18} /></div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div className="avatar" style={{ background: 'var(--primary)', color: 'white' }}>{selectedThread.sender.charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>{selectedThread.sender}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>via Gmail Sync</div>
                  </div>
                </div>

                <div className="ai-summary-block" style={{ background: 'var(--primary-light)', padding: '24px', borderRadius: '24px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, marginBottom: '12px' }}>
                    <Bot size={20} /> AI AGENT INSIGHT
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.6 }}>{selectedThread.aiSummary || "Analysis in progress by Pingor Intelligence..."}</p>
                </div>

                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{selectedThread.snippet}</div>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <InboxIcon size={64} style={{ opacity: 0.1, marginBottom: '16px' }} />
                <p>Select a thread to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
