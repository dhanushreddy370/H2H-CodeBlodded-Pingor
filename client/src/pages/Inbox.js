import React, { useState, useEffect } from 'react';
import { Bot, CheckSquare, Filter, Archive, Trash2, Reply, Forward, Inbox as InboxIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Inbox = () => {
  const { user } = useAuth();
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!user?.sub) return;

    const fetchThreads = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/followups?userId=${user.sub}`);
        const data = await res.json();
        setThreads(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) setSelectedThreadId(data[0]._id);
        else setSelectedThreadId(null);
      } catch (err) {
        setThreads([]);
        setSelectedThreadId(null);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchThreads();
  }, [user]);

  const selectedThread = threads.find(t => t._id === selectedThreadId);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="inbox-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Inbox</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="button" style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
            <Filter size={18} />
          </button>
          <button className="button">Compose</button>
        </div>
      </div>

      <div className="inbox-layout">
        <div className="inbox-sidebar card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '20px' }}>
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '80px', marginBottom: '12px', borderRadius: '8px' }}></div>)}
            </div>
          ) : (
            <div className="threads-list">
              {threads.map(thread => (
                <div 
                  key={thread._id} 
                  className={`email-item ${selectedThreadId === thread._id ? 'selected' : ''}`}
                  onClick={() => setSelectedThreadId(thread._id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="email-subject" style={{ fontWeight: selectedThreadId === thread._id ? '700' : '600' }}>
                      {thread.subject}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(thread.lastUpdated)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="email-sender" style={{ fontSize: '0.85rem' }}>{thread.sender || 'Unknown'}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {thread.snippet}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="inbox-main card" style={{ padding: 0 }}>
          {selectedThread ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{selectedThread.subject}</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="icon-container" style={{ border: '1px solid var(--border)', cursor: 'pointer' }}><Reply size={18} /></div>
                  <div className="icon-container" style={{ border: '1px solid var(--border)', cursor: 'pointer' }}><Archive size={18} /></div>
                  <div className="icon-container" style={{ border: '1px solid var(--border)', color: 'var(--danger-text)', cursor: 'pointer' }}><Trash2 size={18} /></div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div className="avatar" style={{ width: '48px', height: '48px', background: 'var(--primary)', color: 'white' }}>
                    {(selectedThread.sender || 'U').charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{selectedThread.sender}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedThread.sender}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(selectedThread.lastUpdated).toLocaleString()}</div>
                    <span className={`badge ${selectedThread.priority >= 4 ? 'high' : 'pending'}`} style={{ marginTop: '8px' }}>
                      Priority P{selectedThread.priority}
                    </span>
                  </div>
                </div>

                <div className="ai-summary-block">
                  <div className="ai-summary-title">
                    <Bot size={18} /> AI Insight
                  </div>
                  <p style={{ fontSize: '1rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
                    {selectedThread.aiSummary || 'AI analysis pending...'}
                  </p>
                  
                  {selectedThread.extractedTasks && selectedThread.extractedTasks.length > 0 && (
                    <div style={{ marginTop: '20px', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}>
                       <div className="ai-summary-title" style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '12px' }}>
                         <CheckSquare size={16} /> Extracted Action Items
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                         {selectedThread.extractedTasks.map((t, i) => (
                           <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                             {t}
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                </div>

                <div style={{ color: 'var(--text-main)', lineHeight: '1.8', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                  {selectedThread.snippet}
                  {"\n\n"}
                  [Full content synchronized from backend payload]
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <InboxIcon size={48} color="var(--border)" />
              <h3>Select a thread</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
