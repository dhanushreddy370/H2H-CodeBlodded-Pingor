import React, { useState, useEffect } from 'react';
import { Filter, Search, Plus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Tasks = ({ setActivePage }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [prioritySort, setPrioritySort] = useState('');
  const [customFilters, setCustomFilters] = useState([]);
  const [customPrompt, setCustomPrompt] = useState('');
  useEffect(() => {
    fetchTasks();
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

  const fetchTasks = async () => {
    setLoading(true);
    const userId = user?.id || user?.sub;
    if (!userId) {
      setLoading(false);
      return;
    }
    let url = `http://localhost:5000/api/tasks?userId=${userId}&`;
    if (statusFilter) url += `status=${statusFilter}&`;
    if (prioritySort) url += `priority=${prioritySort}&`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch(err) { 
      console.error(err);
      setTasks([]);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  const toggleTaskStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    setTasks(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
    
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch(err) { 
      console.error(err);
      fetchTasks();
    }
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

  return (
    <div className="tasks-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Action Items</h1>
        <button className="button">
          <Plus size={18} /> New Task
        </button>
      </div>
      
      {/* Filters Hub */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter} className="gooey-input-field" style={{ width: 'auto', padding: '8px 16px', borderRadius: 'var(--radius-md)' }}>
              <option value="">Status</option>
              <option value="pending">Pending</option>
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
              placeholder="Ask AI to filter... e.g. 'Only marketing'" 
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="gooey-input-field"
              style={{ borderRadius: 'var(--radius-md)' }}
            />
            <button onClick={createCustomFilter} className="button" style={{ borderRadius: 'var(--radius-md)' }}>Generate</button>
          </div>
        </div>

        {customFilters.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600'}}>SAVED:</span>
            {customFilters.map(f => (
              <button key={f._id} className="quick-action-btn" style={{ borderRadius: 'var(--radius-full)' }}>{f.name}</button>
            ))}
          </div>
        )}
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
                <th>Task Details</th>
                <th>Deadline</th>
                <th>Priority</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(item => (
                <tr key={item._id} className={item.status === 'done' ? 'completed-row' : ''}>
                  <td>
                    <div 
                      onClick={() => toggleTaskStatus(item._id, item.status)}
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
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', textDecoration: item.status === 'done' ? 'line-through' : 'none', opacity: item.status === 'done' ? 0.6 : 1 }}>
                      {item.action}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{formatDate(item.deadline)}</td>
                  <td>
                    <span className={`badge ${item.priority >= 4 ? 'high' : item.priority >= 3 ? 'pending' : 'done'}`}>
                      P{item.priority}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="button" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' }}>Edit</button>
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
