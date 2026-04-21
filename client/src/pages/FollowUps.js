import React, { useState, useEffect } from 'react';
import { Filter, ExternalLink, MessageSquare, Clock, Check, Send, X, Edit2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FollowUps = ({ setActivePage }) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [prioritySort, setPrioritySort] = useState('');
  const [customFilters, setCustomFilters] = useState([]);
  const [customPrompt, setCustomPrompt] = useState('');
  
  // State for draft editing
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchThreads();
    fetchFilters();
  }, [user, statusFilter, prioritySort]);

  const fetchFilters = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/filters`);
      const data = await res.json();
      setCustomFilters(Array.isArray(data) ? data : []);
    } catch(err) {
      console.error(err);
    }
  };

  const fetchThreads = async () => {
    setLoading(true);
    const userId = user?.id || user?.sub;
    if (!userId) {
      setLoading(false);
      return;
    }
    let url = `http://localhost:5000/api/followups?userId=${userId}&`;
    if (statusFilter) url += `status=${statusFilter}&`;
    if (prioritySort) url += `priority=${prioritySort}&`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      setThreads(Array.isArray(data) ? data : []);
    } catch(err) { 
      console.error(err);
      setThreads([]);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'open' : 'done';
    setThreads(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
    
    try {
      await fetch(`http://localhost:5000/api/followups/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch(err) { 
      console.error(err);
      fetchThreads(); 
    }
  };

  const timeSince = (dateString) => {
    const lastUpdateDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - lastUpdateDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return `${diffDays} days ago`;
  };

  const navigateToPingor = (item) => {
    alert(`Added [${item.subject}] to Pingor context!`);
    setActivePage('Pingor Chat');
  };

  const handleApproveDraft = async (id) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/followups/${id}/approve-draft`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Draft approved and pushed to Gmail!');
        fetchThreads(); // Refresh list
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectDraft = async (id) => {
    if (!window.confirm('Are you sure you want to discard this AI suggestion?')) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/followups/${id}/reject-draft`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchThreads();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveEdit = async (id) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/followups/${id}/draft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftText: editingText })
      });
      if (res.ok) {
        setThreads(prev => prev.map(t => t._id === id ? { ...t, aiResponse: editingText } : t));
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="followups-page">
      <h1 className="page-title">Follow-ups Needed</h1>
      
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

          <div style={{ display: 'flex', flex: 1, gap: '8px' }}>
            <input 
              type="text" 
              placeholder="E.g. Show threads older than 1 week..." 
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="gooey-input-field"
              style={{ borderRadius: 'var(--radius-md)' }}
            />
            <button onClick={() => {}} className="button" style={{ borderRadius: 'var(--radius-md)' }}>AI Filter</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="table-container" style={{ padding: '24px' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '12px', borderRadius: '8px' }}></div>
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}></th>
                <th>Sender</th>
                <th>Thread Subject</th>
                <th>Last Update</th>
                <th>Priority</th>
                <th>AI Intelligence</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {threads.map(item => (
                <tr key={item._id}>
                  <td>
                    <div 
                      onClick={() => toggleStatus(item._id, item.status)}
                      style={{ 
                        width: '24px', height: '24px', borderRadius: '6px', 
                        border: `2px solid ${item.status === 'done' ? 'var(--primary)' : 'var(--border)'}`,
                        background: item.status === 'done' ? 'var(--primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {item.status === 'done' && <Check size={16} color="white" />}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{item.sender || 'Unknown'}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{item.subject}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Clock size={14} /> {timeSince(item.lastUpdated)}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${item.priority >= 4 ? 'high' : item.priority >= 3 ? 'pending' : 'done'}`}>
                      P{item.priority}
                    </span>
                  </td>
                  <td>
                    {item.handledByAI ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className={`badge ${item.draftStatus === 'pending_approval' ? 'pending' : 'done'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                            {item.draftStatus === 'pending_approval' ? 'AI Draft (Review Needed)' : 'AI Handled'}
                          </span>
                          
                          {item.draftStatus === 'pending_approval' && editingId !== item._id && (
                            <button 
                              onClick={() => { setEditingId(item._id); setEditingText(item.aiResponse); }}
                              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '2px' }}
                              title="Edit Draft"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>

                        {editingId === item._id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <textarea 
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="gooey-input-field"
                              style={{ fontSize: '0.8rem', minHeight: '80px', width: '100%', resize: 'vertical', padding: '8px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => handleSaveEdit(item._id)} 
                                className="button" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem', flex: 1 }}
                                disabled={isActionLoading}
                              >
                                <Save size={14} /> Save
                              </button>
                              <button 
                                onClick={() => setEditingId(null)} 
                                className="button" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            style={{ 
                              fontSize: '0.85rem', 
                              color: 'var(--text-main)', 
                              background: 'rgba(var(--primary-rgb), 0.05)',
                              padding: '8px',
                              borderRadius: '4px',
                              borderLeft: '3px solid var(--primary)',
                              fontStyle: 'italic',
                              maxHeight: '100px',
                              overflowY: 'auto'
                            }}
                          >
                            "{item.aiResponse}"
                          </div>
                        )}

                        {item.draftStatus === 'pending_approval' && editingId !== item._id && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button 
                              onClick={() => handleApproveDraft(item._id)}
                              className="button"
                              style={{ flex: 1, padding: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                              disabled={isActionLoading}
                            >
                              <Send size={14} /> Approve & Send
                            </button>
                            <button 
                              onClick={() => handleRejectDraft(item._id)}
                              className="button"
                              style={{ background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '6px', fontSize: '0.75rem' }}
                              disabled={isActionLoading}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Awaiting Analysis</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => navigateToPingor(item)} className="button" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                        <MessageSquare size={14} /> Pingor
                      </button>
                      <button className="button" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FollowUps;
