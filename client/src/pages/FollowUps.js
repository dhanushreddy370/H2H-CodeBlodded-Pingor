import React, { useState, useEffect } from 'react';
import { Filter, ExternalLink, MessageSquare } from 'lucide-react';

const FollowUps = ({ setActivePage }) => {
  const [threads, setThreads] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [prioritySort, setPrioritySort] = useState('');
  const [customFilters, setCustomFilters] = useState([]);
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    fetchThreads();
    fetchFilters();
  }, [statusFilter, prioritySort]);

  const fetchThreads = async () => {
    let url = 'http://localhost:5000/api/followups?';
    if (statusFilter) url += `status=${statusFilter}&`;
    if (prioritySort) url += `priority=${prioritySort}&`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setThreads(data);
    } catch(err) { console.error(err); }
  };

  const fetchFilters = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/filters');
      const data = await res.json();
      setCustomFilters(data);
    } catch(err) { console.error(err); }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'open' : 'done';
    try {
      await fetch(`http://localhost:5000/api/followups/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchThreads();
    } catch(err) { console.error(err); }
  };

  const createCustomFilter = async () => {
    if (!customPrompt) return;
    try {
      await fetch('http://localhost:5000/api/filters/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: customPrompt, name: customPrompt.substring(0, 20) })
      });
      setCustomPrompt('');
      fetchFilters();
    } catch(err) { console.error(err); }
  };

  const timeSince = (dateString) => {
    const lastUpdateDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - lastUpdateDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return `${diffDays} days ago`;
  };

  const navigateToPingor = (item) => {
    // In a real app we might pass context via state router or context API
    // We'll just alert and switch page for now, usually you'd set a global 'selectedChatContext'
    alert(`Added [${item.subject}] to Pingor context!`);
    setActivePage('Pingor Chat');
  };

  const renderThreads = Array.isArray(threads) ? threads : [];

  return (
    <div>
      <h1 className="page-title">Follow-ups Needed</h1>
      
      {/* Controls Container */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="done">Done</option>
        </select>
        
        <select onChange={(e) => setPrioritySort(e.target.value)} value={prioritySort} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
          <option value="">Sort Priority</option>
          <option value="desc">Highest First</option>
          <option value="asc">Lowest First</option>
        </select>

        <div style={{ display: 'flex', flex: 1, gap: '8px' }}>
          <input 
            type="text" 
            placeholder="E.g. Show dormant threads..." 
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
          />
          <button onClick={createCustomFilter} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Generate AI Filter</button>
        </div>
      </div>

      {renderThreads.length === 0 ? (
        <div className="empty-state card">
          <h3>No follow-ups needed 🎉</h3>
          <p>You're completely up to date!</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Done</th>
                <th>Sender / Last Reply</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {renderThreads.map(item => (
                <tr key={item._id}>
                  <td>
                    <input type="checkbox" checked={item.status === 'done'} onChange={() => toggleStatus(item._id, item.status)} />
                  </td>
                  <td>
                    <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{item.sender || 'Unknown Sender'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{timeSince(item.lastUpdated)}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.subject}</td>
                  <td>
                    <span className="badge" style={{background: 'var(--warning-bg)', color: 'var(--warning-text)'}}>
                      P{item.priority || 3}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => navigateToPingor(item)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        <MessageSquare size={14} /> Pingor
                      </button>
                      <button onClick={() => alert('Viewing Original Email from Gmail Simulator')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        <ExternalLink size={14} /> View
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
