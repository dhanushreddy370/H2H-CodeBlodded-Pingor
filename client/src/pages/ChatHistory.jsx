import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, Plus, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChatHistory = ({ onOpenChat }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = user?.id || user?.sub;
    if (userId) {
      fetchSessions(userId);
    }
  }, [user]);

  const fetchSessions = async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/history?userId=${userId}`);
      const data = await res.json();
      setSessions(data);
    } catch(err) {
      console.error('Failed to fetch chat history', err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const formatDate = (dateString) => {
    if(!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
  };

  return (
    <div className="tasks-page" style={{ display: 'flex', gap: '24px', height: '100%' }}>
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <button className="button" onClick={onOpenChat}>
            <Plus size={18} /> New Chat
          </button>
        </div>

        <div className="card" style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          {loading ? (
            <div>
               {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '70px', marginBottom: '12px', borderRadius: '12px' }}></div>)}
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', padding: '60px 0' }}>
              <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p>No chat history found.</p>
              <button className="button" onClick={() => onOpenChat(null)} style={{ marginTop: '16px' }}>Start a new chat</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', padding: '8px' }}>
              {sessions.map(s => (
                <div 
                  key={s._id} 
                  className="card nav-item"
                  onClick={() => onOpenChat(s._id)}
                  style={{ 
                    padding: '20px', 
                    borderRadius: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                    <div className="icon-container" style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '48px', height: '48px', flexShrink: 0 }}>
                      <MessageSquare size={24} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <Clock size={14} /> {formatDate(s.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;
