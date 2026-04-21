import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Clock, MessageSquare, Check, X, Edit2, Send, Bot, Sparkles, Filter, MoreHorizontal, ChevronRight, Save, Trash2, Archive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DetailModal from '../components/DetailModal';

const FollowUps = ({ onOpenChat }) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [draftContent, setDraftContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [prioritySort, setPrioritySort] = useState('');

  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const userId = user?.id || user?.sub;
      if (!userId) return;
      
      let url = `http://localhost:5000/api/threads?userId=${userId}`;
      const res = await fetch(url);
      const data = await res.json();
      
      // Filter for follow-ups (FYI/informational or pending drafts)
      let filtered = data.filter(t => t.categoryTag === 'FYI/informational' || t.draftStatus !== 'none');
      
      if (statusFilter) {
        filtered = filtered.filter(t => t.status === statusFilter);
      }
      
      if (prioritySort) {
        filtered.sort((a, b) => {
          return prioritySort === 'desc' ? b.priority - a.priority : a.priority - b.priority;
        });
      }

      setThreads(filtered);
    } catch (err) {
      console.error('Failed to fetch follow-ups', err);
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter, prioritySort]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const handleUpdate = (updated) => {
    setThreads(prev => prev.map(t => t._id === updated._id ? updated : t));
  };

  const approveDraft = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/followups/approve/${id}`, { method: 'POST' });
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  const rejectDraft = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/followups/reject/${id}`, { method: 'POST' });
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  const saveEdit = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/followups/edit/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiResponse: draftContent })
      });
      setEditingDraftId(null);
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="followups-page">
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter} className="gooey-input-field" style={{ width: 'auto', padding: '8px 16px', borderRadius: 'var(--radius-md)' }}>
              <option value="">Status</option>
              <option value="open">Open</option>
              <option value="done">Done</option>
            </select>
            
            <select onChange={(e) => setPrioritySort(e.target.value)} value={prioritySort} className="gooey-input-field" style={{ width: 'auto', padding: '8px 16px', borderRadius: 'var(--radius-md)' }}>
              <option value="">Priority</option>
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '120px', marginBottom: '16px', borderRadius: '16px' }}></div>)}
          </div>
        ) : threads.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Sparkles size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>Your inbox is perfectly synced. No drafts pending!</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Communication Details</th>
                  <th>AI Intelligence / Draft</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {threads.map(thread => (
                  <tr key={thread._id} onClick={() => { setSelectedThread(thread); setIsModalOpen(true); }} style={{ cursor: 'pointer' }}>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className={`badge priority-${thread.priority}`}>P{thread.priority}</span>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>{thread.subject}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{thread.sender}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                         "{thread.snippet?.substring(0, 80)}..."
                      </div>
                    </td>
                    <td>
                      {thread.draftStatus === 'pending_approval' ? (
                        <div 
                          className="card" 
                          onClick={e => e.stopPropagation()}
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--primary)', padding: '16px', borderRadius: '16px', marginTop: '8px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--primary)', fontWeight: '700', fontSize: '0.8rem' }}>
                            <Bot size={16} /> AI GENERATED RESPONSE
                          </div>
                          
                          {editingDraftId === thread._id ? (
                            <textarea 
                              className="chat-input"
                              value={draftContent}
                              onChange={e => setDraftContent(e.target.value)}
                              style={{ width: '100%', minHeight: '100px', marginBottom: '12px', fontSize: '0.9rem' }}
                            />
                          ) : (
                            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                              {thread.aiResponse}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                            {editingDraftId === thread._id ? (
                              <button className="button" onClick={() => saveEdit(thread._id)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                <Save size={14} style={{ marginRight: '4px' }} /> Save
                              </button>
                            ) : (
                              <button className="button-secondary" onClick={() => { setEditingDraftId(thread._id); setDraftContent(thread.aiResponse); }} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                <Edit2 size={14} />
                              </button>
                            )}
                            <button className="button" onClick={() => approveDraft(thread._id)} style={{ background: '#16a34a', border: 'none', padding: '6px 12px', fontSize: '0.8rem' }}>
                              <Send size={14} style={{ marginRight: '4px' }} /> Approve & Send
                            </button>
                            <button className="button-secondary" onClick={() => rejectDraft(thread._id)} style={{ color: '#ef4444', padding: '6px 12px', fontSize: '0.8rem' }}>
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No automated draft required. Thread marked as FYI.</div>
                      )}
                    </td>
                    <td>
                       <ChevronRight size={18} color="var(--text-muted)" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedThread}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default FollowUps;
