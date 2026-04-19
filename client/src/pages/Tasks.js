import React, { useState, useEffect } from 'react';
import { Filter, Search } from 'lucide-react';

const Tasks = ({ setActivePage }) => {
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [prioritySort, setPrioritySort] = useState('');
  const [customFilters, setCustomFilters] = useState([]);
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchFilters();
  }, [statusFilter, prioritySort]);

  const fetchTasks = async () => {
    let url = 'http://localhost:5000/api/tasks?';
    if (statusFilter) url += `status=${statusFilter}&`;
    if (prioritySort) url += `priority=${prioritySort}&`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setTasks(data);
    } catch(err) { console.error(err); }
  };

  const fetchFilters = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/filters');
      const data = await res.json();
      setCustomFilters(data);
    } catch(err) { console.error(err); }
  };

  const toggleTaskStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchTasks();
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

  const formatDate = (dateString) => {
    if(!dateString) return 'No Deadline';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Safe error handling wrapper for map
  const renderTasks = Array.isArray(tasks) ? tasks : [];

  return (
    <div>
      <h1 className="page-title">Tasks (Action Items)</h1>
      
      {/* Controls Container */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
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
            placeholder="E.g. Only show tasks related to marketing..." 
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
          />
          <button onClick={createCustomFilter} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Generate AI Filter</button>
        </div>
      </div>

      {/* Custom Filters UI */}
      {customFilters.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{color: 'var(--text-muted)', display: 'flex', alignItems: 'center'}}><Filter size={14} style={{marginRight: '4px'}}/> Saved Filters:</span>
          {customFilters.map(f => (
            <button key={f._id} style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-main)' }}>
              {f.name}
            </button>
          ))}
        </div>
      )}

      {renderTasks.length === 0 ? (
        <div className="empty-state card">
          <h3>No tasks found 🎉</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Done</th>
                <th>Task Action</th>
                <th>Deadline</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {renderTasks.map(item => (
                <tr key={item._id}>
                  <td>
                    <input type="checkbox" checked={item.status === 'done'} onChange={() => toggleTaskStatus(item._id, item.status)} />
                  </td>
                  <td style={{ fontWeight: '500', color: 'var(--text-main)', textDecoration: item.status === 'done' ? 'line-through' : 'none' }}>{item.action}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatDate(item.deadline)}</td>
                  <td>
                    <span className="badge priority-item" style={{background: 'var(--success-bg)', color: 'var(--success-text)'}}>
                      {item.priority || 3}
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
