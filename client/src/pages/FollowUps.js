import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Clock, MessageSquare, Check, X, Edit2, Send, Bot, Sparkles, Filter, MoreHorizontal, ChevronRight, Save, Trash2, Archive, Plus, AlertCircle, CalendarCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DetailModal from '../components/DetailModal';
import CustomSelect from '../components/ui/CustomSelect';
import { API_BASE } from '../config';

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
    const userId = user?.id || user?.sub;
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      let url = `${API_BASE}/api/followups?userId=${userId}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (prioritySort) url += `&priority=${prioritySort}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setThreads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch follow-ups', err);
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter, prioritySort]);

  useEffect(() => {
    fetchFollowUps();
    const interval = setInterval(fetchFollowUps, 15000);
    return () => clearInterval(interval);
  }, [fetchFollowUps]);

  const handleUpdate = (updated) => {
    setThreads(prev => prev.map(t => t._id === updated._id ? updated : t));
  };

  const approveDraft = async (id) => {
    try {
      await fetch(`${API_BASE}/api/followups/approve/${id}`, { method: 'POST' });
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  const rejectDraft = async (id) => {
    try {
      await fetch(`${API_BASE}/api/followups/reject/${id}`, { method: 'POST' });
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  const saveEdit = async (id) => {
    try {
      await fetch(`${API_BASE}/api/followups/edit/${id}`, {
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
      <div className="card" style={{ padding: '20px', marginBottom: '24px', zIndex: 10, overflow: 'visible', background: '#f8fafc', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <CustomSelect 
              value={statusFilter} 
              onChange={setStatusFilter} 
              options={[
                { value: '', label: 'Status' },
                { value: 'open', label: 'Open' },
                { value: 'done', label: 'Done' }
              ]}
              placeholder="Status"
            />
            
            <CustomSelect 
              value={prioritySort} 
              onChange={setPrioritySort} 
              options={[
                { value: '', label: 'Priority' },
                { value: 'desc', label: 'High to Low' },
                { value: 'asc', label: 'Low to High' }
              ]}
              placeholder="Priority"
            />
          </div>

          <button className="button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px' }} onClick={() => { setSelectedThread({}); setIsModalOpen(true); }}>
            <Plus size={20} /> New Follow-up
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '24px' }}>
        {loading && threads.length === 0 ? (
          <div style={{ padding: '40px' }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: '140px', marginBottom: '16px', borderRadius: '20px' }}></div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div style={{ padding: '100px 40px', textAlign: 'center' }}>
            <div style={{ width: '120px', height: '120px', background: '#f1f5f9', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
              <CalendarCheck size={60} style={{ color: 'var(--primary)', opacity: 0.2 }} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px', color: 'var(--text-main)' }}>No pending follow-ups</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px', lineHeight: 1.6 }}>
              You’re all caught up. Pingor will alert you when a new follow-up requires your attention based on your email interactions.
            </p>
            <button className="button-secondary" onClick={() => { setSelectedThread({}); setIsModalOpen(true); }}>
              <Plus size={18} /> Create Manual Follow-up
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Priority</th>
                  <th>Communication Details</th>
                  <th>AI Draft & Actions</th>
                  <th style={{ width: '100px' }}>Agent</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {threads.map(thread => (
                  <tr key={thread._id} onClick={() => { setSelectedThread(thread); setIsModalOpen(true); }} style={{ cursor: 'pointer' }}>
                    <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                      <span className={`badge priority-${thread.priority}`} style={{ borderRadius: '8px', padding: '6px 12px', fontWeight: 800 }}>P{thread.priority}</span>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{ fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px', fontSize: '1rem' }}>{thread.subject}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{thread.sender}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '12px', fontStyle: 'italic', lineHeight: 1.5, background: '#f8fafc', padding: '10px', borderRadius: '12px' }}>
                         "{thread.snippet?.substring(0, 100)}..."
                      </div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      {thread.draftStatus === 'pending_approval' ? (
                        <div 
                          className="card" 
                          onClick={e => e.stopPropagation()}
                          style={{ background: 'white', border: '1px solid var(--primary)', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.05)' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--primary)', fontWeight: '900', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <Sparkles size={16} /> AI Drafted Reply
                          </div>
                          
                          {editingDraftId === thread._id ? (
                            <textarea 
                              className="chat-input"
                              value={draftContent}
                              onChange={e => setDraftContent(e.target.value)}
                              style={{ width: '100%', minHeight: '120px', marginBottom: '16px', fontSize: '0.95rem', borderRadius: '12px', padding: '12px', border: '1px solid var(--primary)' }}
                            />
                          ) : (
                            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '16px', color: '#1e293b' }}>
                              {thread.aiResponse}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            {editingDraftId === thread._id ? (
                              <button className="button" onClick={() => saveEdit(thread._id)}>
                                <Save size={16} /> Save
                              </button>
                            ) : (
                              <button className="button-secondary" onClick={() => { setEditingDraftId(thread._id); setDraftContent(thread.aiResponse); }} title="Edit Draft">
                                <Edit2 size={16} />
                              </button>
                            )}
                            <button className="button" onClick={() => approveDraft(thread._id)} style={{ background: '#10b981' }}>
                              <Send size={16} /> Send
                            </button>
                            <button className="button-danger" onClick={() => rejectDraft(thread._id)} title="Reject Draft">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px', background: '#f8fafc', borderRadius: '16px', textAlign: 'center', border: '1px dashed var(--border)' }}>
                          No automated draft required.
                        </div>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChat({ 
                            sender: thread.sender, 
                            subject: thread.subject,
                            snippet: thread.snippet,
                            threadId: thread._id
                          });
                        }}
                        className="icon-container"
                        style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', cursor: 'pointer', width: '44px', height: '44px', borderRadius: '12px' }}
                        title="Chat with Pingor"
                      >
                        <MessageSquare size={20} />
                      </button>
                    </td>
                    <td>
                       <ChevronRight size={20} color="var(--text-muted)" style={{ opacity: 0.5 }} />
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
        type="followup"
      />
    </div>
  );
};

export default FollowUps;

