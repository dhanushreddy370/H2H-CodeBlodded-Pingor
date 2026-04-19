import React, { useState, useEffect } from 'react';
import { Filter, Search } from 'lucide-react';

const Tasks = () => {
  const [actionItems, setActionItems] = useState([
    { _id: 'a_1', action: 'Review Q3 Marketing Assets', deadline: '2026-10-27T10:00:00Z', status: 'pending', type: 'Review' },
    { _id: 'a_2', action: 'Send invoice to Client A', deadline: '2026-10-28T14:30:00Z', status: 'pending', type: 'Finance' },
    { _id: 'a_3', action: 'Update project timeline', deadline: '2026-10-25T09:00:00Z', status: 'done', type: 'Management' },
    { _id: 'a_4', action: 'Schedule weekly sync', deadline: '2026-10-26T11:00:00Z', status: 'done', type: 'Internal' }
  ]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filterPromptOpen, setFilterPromptOpen] = useState(false);
  const [customFilterText, setCustomFilterText] = useState('');

  // Example of how high-frequency data fetching would happen via API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
         // This would match the new advanced endpoint:
         // const res = await fetch(`/api/tasks?status=${statusFilter}&sortBy=deadline`);
         // const data = await res.json();
         // setActionItems(data);
      } catch (err) {
         console.error("Failed fetching tasks", err);
      }
    };
    fetchTasks();
  }, [statusFilter]); // High-frequency re-fetch optimization block

  const handleMarkDone = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'done' : 'pending';
    
    // Optimistic UI update for high-frequency react state execution
    setActionItems(items => items.map(t => t._id === id ? { ...t, status: newStatus } : t));

    try {
      // Background patch execution
      await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleCustomFilterSubmit = async () => {
    // Sends natural language to AI agent `/api/filters` endpoint
    try {
      await fetch('http://localhost:5000/api/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naturalLanguagePrompt: customFilterText })
      });
      alert(`AI Agent created a filter query for: "${customFilterText}"`);
    } catch (err) {
      console.error("Error creating AI filter", err);
    }
    setFilterPromptOpen(false);
    setCustomFilterText('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredTasks = actionItems.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Tasks</h1>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="done">Done</option>
          </select>
          
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
            <option value="all">All Types</option>
            <option value="Review">Review</option>
            <option value="Finance">Finance</option>
            <option value="Management">Management</option>
            <option value="Internal">Internal</option>
          </select>

          <button onClick={() => setFilterPromptOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Filter size={16} /> Custom AI Filter
          </button>
        </div>
      </div>

      {filterPromptOpen && (
        <div className="card" style={{ marginBottom: '24px', background: 'var(--bg-primary)' }}>
          <h3 className="section-title">Describe your filter to Pingor</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="e.g. 'emails about the XSR155 project'" 
              value={customFilterText}
              onChange={(e) => setCustomFilterText(e.target.value)}
              className="chat-input"
              style={{ flex: 1 }}
            />
            <button className="chat-send-btn" onClick={handleCustomFilterSubmit} style={{ borderRadius: '8px', width: 'auto', padding: '0 24px' }}>Create</button>
            <button className="chat-send-btn" onClick={() => setFilterPromptOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '8px', width: 'auto', padding: '0 24px' }}>Cancel</button>
          </div>
        </div>
      )}
      
      {filteredTasks.length === 0 ? (
        <div className="empty-state card">
          <h3>No tasks match your filters 🎉</h3>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Task Action</th>
                <th>Task Type</th>
                <th>Deadline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(item => (
                <tr key={item._id} style={{ opacity: item.status === 'done' ? 0.6 : 1 }}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={item.status === 'done'} 
                      onChange={() => handleMarkDone(item._id, item.status)}
                      style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                    />
                  </td>
                  <td style={{ fontWeight: '500', color: 'var(--text-main)', textDecoration: item.status === 'done' ? 'line-through' : 'none' }}>
                    {item.action}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatDate(item.deadline)}</td>
                  <td>
                    <span className={`badge ${item.status}`}>
                      {item.status === 'pending' ? 'Pending' : 'Done'}
                    </span>
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

export default Tasks;
