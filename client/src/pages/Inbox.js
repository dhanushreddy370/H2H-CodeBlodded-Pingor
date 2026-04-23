import React, { useState, useEffect, useCallback } from 'react';
import { Bot, CheckSquare, Filter, Archive, Trash2, Reply, Inbox as InboxIcon, Search, CheckCircle, XCircle, Loader2, Plus, Sparkles, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GooeyInput } from '../components/ui/GooeyInput';
import { API_BASE } from '../config';

const Inbox = () => {
  const { user } = useAuth();
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSendingNow, setIsSendingNow] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '', _isReply: false });

  const fetchThreads = useCallback(async () => {
    const userId = user?.id || user?.sub;
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/threads?userId=${userId}`);
      const data = await res.json();
      const activeThreads = Array.isArray(data) ? data.filter(t => !t.archived && !t.trashed) : [];
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
    const interval = setInterval(fetchThreads, 15000);
    return () => clearInterval(interval);
  }, [fetchThreads]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    if (type !== 'loading') {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleGmailAction = async (action) => {
    try {
      showToast(`Syncing with Gmail: ${action}...`, 'loading');
      const res = await fetch(`${API_BASE}/api/threads/${selectedThreadId}/sync-gmail`, {
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

  const handleSendCompose = async () => {
    const userId = user?.id || user?.sub;
    if (!userId) return;
    if (!composeData.to || !composeData.subject || !composeData.body) {
      showToast('Please fill in To, Subject, and Message fields', 'error');
      return;
    }
    setIsSavingDraft(true);
    showToast('Saving draft to Gmail...', 'loading');
    const replyThreadId = composeData._isReply ? selectedThread?.threadId : null;
    try {
      const res = await fetch(`${API_BASE}/api/inbox/send-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          threadId: replyThreadId,
          to: composeData.to,
          subject: composeData.subject,
          body: composeData.body
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Draft saved to Gmail successfully!');
        setIsComposeOpen(false);
        setComposeData({ to: '', subject: '', body: '', _isReply: false });
      } else {
        showToast(data.error || 'Failed to save draft', 'error');
      }
    } catch (err) {
      showToast('Connection error — could not reach server', 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSendNow = async () => {
    const userId = user?.id || user?.sub;
    if (!userId) return;
    if (!composeData.to || !composeData.subject || !composeData.body) {
      showToast('Please fill in To, Subject, and Message fields', 'error');
      return;
    }
    setIsSendingNow(true);
    showToast('Sending email via Gmail...', 'loading');
    const replyThreadId = composeData._isReply ? selectedThread?.threadId : null;
    try {
      const res = await fetch(`${API_BASE}/api/inbox/send-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          threadId: replyThreadId,
          to: composeData.to,
          subject: composeData.subject,
          body: composeData.body
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Email sent successfully via Gmail!');
        setIsComposeOpen(false);
        setComposeData({ to: '', subject: '', body: '', _isReply: false });
      } else {
        showToast(data.error || 'Failed to send email', 'error');
      }
    } catch (err) {
      showToast('Connection error — could not reach server', 'error');
    } finally {
      setIsSendingNow(false);
    }
  };

  const handleManualReply = () => {
    if (!selectedThread) return;
    setComposeData({
      to: selectedThread.sender,
      subject: selectedThread.subject.startsWith('Re:') ? selectedThread.subject : `Re: ${selectedThread.subject}`,
      body: `\n\n--- On ${new Date(selectedThread.lastUpdated).toLocaleString()}, ${selectedThread.sender} wrote:\n> ${selectedThread.snippet}`,
      _isReply: true
    });
    setIsComposeOpen(true);
  };

  const handleAIReply = async () => {
    if (!selectedThread) return;
    setIsGeneratingAI(true);
    showToast('Pingor AI is crafting a reply...', 'loading');
    
    try {
      const res = await fetch(`${API_BASE}/api/threads/${selectedThreadId}/generate-reply`, { method: 'POST' });
      const data = await res.json();
      
      if (data.reply) {
        setComposeData({
          to: selectedThread.sender,
          subject: selectedThread.subject.startsWith('Re:') ? selectedThread.subject : `Re: ${selectedThread.subject}`,
          body: data.reply,
          _isReply: true
        });
        setIsComposeOpen(true);
        showToast('AI reply generated!');
      } else {
        showToast('Failed to generate AI reply', 'error');
      }
    } catch (err) {
      showToast('AI connection error', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const selectedThread = threads.find(t => t._id === selectedThreadId);
  const filteredThreads = threads.filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.sender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && threads.length === 0) {
    return (
      <div className="loading-overlay">
        <dotlottie-player
          src="https://lottie.host/a0777886-4a6c-4f15-be5d-99a902caa6ae/5chwxQ3WHT.lottie"
          background="transparent" speed="1" style={{ width: '200px', height: '200px' }} loop autoplay
        ></dotlottie-player>
      </div>
    );
  }

  return (
    <div className="inbox-page">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: notification.type === 'error' ? '#ef4444' : notification.type === 'loading' ? 'var(--primary)' : '#16a34a',
          color: '#ffffff', padding: '12px 24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '10px', animation: 'slideUp 0.3s ease'
        }}>
          {notification.type === 'loading' ? <Loader2 size={18} className="animate-spin" /> : 
           notification.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Gmail-style compose window (fixed position, bottom-right) */}
      {isComposeOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '100px',
          width: '540px',
          maxWidth: 'calc(100vw - 48px)',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease'
        }}>
          {/* Header */}
          <div style={{
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'default',
            borderRadius: '16px 16px 0 0',
            borderBottom: '1px solid var(--border)'
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>New Message</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <XCircle
                size={18}
                style={{ cursor: 'pointer', opacity: 0.8 }}
                onClick={() => { setIsComposeOpen(false); setComposeData({ to: '', subject: '', body: '', _isReply: false }); }}
              />
            </div>
          </div>

          {/* To field */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '8px 16px', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '40px' }}>To</span>
            <input
              type="email"
              placeholder=""
              value={composeData.to}
              onChange={e => setComposeData({ ...composeData, to: e.target.value })}
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem',
                background: 'transparent', color: 'var(--text-main)'
              }}
            />
          </div>

          {/* Subject field */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '8px 16px', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '40px' }}>Subject</span>
            <input
              type="text"
              placeholder=""
              value={composeData.subject}
              onChange={e => setComposeData({ ...composeData, subject: e.target.value })}
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem',
                background: 'transparent', color: 'var(--text-main)'
              }}
            />
          </div>

          {/* Body */}
          <textarea
            placeholder="Write your message here..."
            value={composeData.body}
            onChange={e => setComposeData({ ...composeData, body: e.target.value })}
            style={{
              border: 'none', outline: 'none', resize: 'none',
              minHeight: '240px', padding: '16px', fontSize: '0.9rem',
              fontFamily: 'inherit', background: 'var(--bg-card)', color: 'var(--text-main)',
              lineHeight: 1.6
            }}
          />

          {/* Footer */}
          <div style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-primary)'
          }}>
            <button
              onClick={handleSendNow}
              disabled={isSendingNow || isSavingDraft}
              style={{
                background: 'var(--primary)', color: '#ffffff', border: 'none',
                borderRadius: '20px', padding: '8px 20px', fontWeight: 700,
                fontSize: '0.9rem', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '6px', opacity: (isSendingNow || isSavingDraft) ? 0.7 : 1
              }}
            >
              {isSendingNow ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {isSendingNow ? 'Sending...' : 'Send'}
            </button>
            <button
              onClick={handleSendCompose}
              disabled={isSavingDraft || isSendingNow}
              style={{
                background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)',
                borderRadius: '20px', padding: '8px 16px', fontWeight: 600,
                fontSize: '0.85rem', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '6px', opacity: (isSavingDraft || isSendingNow) ? 0.7 : 1
              }}
            >
              {isSavingDraft ? <Loader2 size={14} className="animate-spin" /> : null}
              {isSavingDraft ? 'Saving...' : 'Save as Draft'}
            </button>
            <div style={{ flex: 1 }} />
            <Trash2
              size={18}
              style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => { setIsComposeOpen(false); setComposeData({ to: '', subject: '', body: '', _isReply: false }); }}
              title="Discard"
            />
          </div>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <GooeyInput 
          placeholder="Search messages..." 
          className="search-expand-container" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="inbox-layout">
        <div className="inbox-sidebar card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
            <div style={{ fontWeight: '900', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>INBOX</div>
            <button onClick={() => { setComposeData({ to: '', subject: '', body: '', _isReply: false }); setIsComposeOpen(true); }} className="icon-container" style={{ color: 'var(--primary)', cursor: 'pointer', border: 'none', background: 'var(--bg-card)' }}>
               <Plus size={18} />
            </button>
          </div>
          <div className="threads-list" style={{ overflowY: 'auto', flex: 1 }}>
            {filteredThreads.length > 0 ? filteredThreads.map(thread => (
              <div 
                key={thread._id} 
                className={`email-item ${selectedThreadId === thread._id ? 'selected' : ''}`}
                onClick={() => setSelectedThreadId(thread._id)}
                style={{ padding: '20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: selectedThreadId === thread._id ? '800' : '600', fontSize: '0.95rem', color: selectedThreadId === thread._id ? 'var(--primary)' : 'var(--text-main)' }}>
                    {thread.subject}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(thread.lastUpdated).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{thread.snippet}</div>
              </div>
            )) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <InboxIcon size={48} style={{ opacity: 0.1, marginBottom: '16px', display: 'block', margin: '0 auto' }} />
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Your inbox is empty</div>
                <div style={{ fontSize: '0.8rem' }}>Great job! You've cleared all your messages.</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="inbox-main card" style={{ padding: 0 }}>
          {selectedThread ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
                <div style={{ maxWidth: '70%' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{selectedThread.subject}</h2>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="icon-container" onClick={handleManualReply} style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }} title="Manual Reply"><Reply size={18} /></button>
                  <button 
                    className="icon-container" 
                    onClick={handleAIReply} 
                    disabled={isGeneratingAI}
                    style={{ border: '1px solid var(--border)', color: 'var(--primary)', background: 'var(--bg-card)' }} 
                    title="AI Generate Reply"
                  >
                    {isGeneratingAI ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  </button>
                  <button className="icon-container" onClick={() => handleGmailAction('trash')} style={{ border: '1px solid var(--border)', color: '#ef4444', background: 'var(--bg-card)' }} title="Trash"><Trash2 size={18} /></button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: 'var(--bg-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                  <div className="avatar" style={{ background: 'var(--primary)', color: '#ffffff', width: '48px', height: '48px', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 800 }}>
                    {selectedThread.sender.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedThread.sender}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>via Gmail Sync</div>
                  </div>
                </div>

                <div className="ai-summary-block" style={{ background: 'var(--primary-light)', padding: '28px', borderRadius: '24px', marginBottom: '40px', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontWeight: 900, marginBottom: '16px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <Bot size={20} /> AI Insight
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-main)', fontWeight: 500 }}>{selectedThread.aiSummary || "Analysis in progress by Pingor Intelligence..."}</p>
                </div>

                <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '0px' }}>
                  {selectedThread.content && selectedThread.content.includes('<') ? (
                    <div 
                      style={{ lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--text-main)' }}
                      dangerouslySetInnerHTML={{ __html: selectedThread.content }} 
                    />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                      {selectedThread.content || selectedThread.snippet}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', maxWidth: '300px' }}>
                <div style={{ width: '80px', height: '80px', background: 'var(--sidebar-hover)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <InboxIcon size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                </div>
                <h3 style={{ fontWeight: 800, marginBottom: '8px' }}>Select a conversation</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>Choose a thread from the list on the left to read its content and take AI-powered actions.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;

