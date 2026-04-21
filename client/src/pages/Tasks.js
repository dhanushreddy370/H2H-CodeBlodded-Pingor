import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, Clock, CheckCircle, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DetailModal from '../components/DetailModal';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [prioritySort, setPrioritySort] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const userId = user?.id || user?.sub;
      if (!userId) {
        setLoading(false);
        return;
      }
      let url = `http://localhost:5000/api/tasks?userId=${userId}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (prioritySort) url += `&priority=${prioritySort}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter, prioritySort]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openTask = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleUpdate = (updatedTask) => {
    setTasks(prev => {
      const filtered = prev.filter(t => t._id !== updatedTask._id);
      const newTasks = [...filtered, updatedTask];
      // Re-sort: Done at bottom, then by updatedAt
      return newTasks.sort((a, b) => {
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
    });
  };

  const formatDate = (d) => {
    if (!d) return 'No Deadline';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="tasks-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Action Items</h1>
        <button className="button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => openTask({})}>
          <Plus size={20} /> New Task
        </button>
      </div>

      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter} className="gooey-input-field" style={{ width: 'auto', padding: '8px 16px', borderRadius: 'var(--radius-md)' }}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="done">Done</option>
            </select>
            
            <select onChange={(e) => setPrioritySort(e.target.value)} value={prioritySort} className="gooey-input-field" style={{ width: 'auto', padding: '8px 16px', borderRadius: 'var(--radius-md)' }}>
              <option value="">Sort Priority</option>
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px' }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '70px', marginBottom: '12px', borderRadius: '12px' }}></div>)}
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>All tasks completed! Take a break.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Action Required</th>
                  <th>Assignee</th>
                  <th>Deadline</th>
                  <th>Priority</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr 
                    key={task._id} 
                    onClick={() => openTask(task)} 
                    className={task.status === 'done' ? 'task-done' : ''}
                    style={{ opacity: task.status === 'done' ? 0.6 : 1, cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ 
                        width: '20px', height: '20px', borderRadius: '6px', 
                        border: '2px solid var(--border)',
                        background: task.status === 'done' ? 'var(--primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                      }}>
                        {task.status === 'done' && <CheckCircle size={14} />}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{task.action}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{task.sender}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {task.assignees?.length > 0 ? task.assignees.map((a, idx) => (
                          <div key={a._id || idx} className="avatar" title={a.name} style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}>
                            {a.name ? a.name.charAt(0) : '?'}
                          </div>
                        )) : <User size={16} color="var(--text-muted)" />}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: task.status !== 'done' && task.deadline && new Date(task.deadline) < new Date() ? '#ef4444' : 'inherit' }}>
                        <Clock size={14} /> {formatDate(task.deadline)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge priority-${task.priority}`}>
                        Priority {task.priority}
                      </span>
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
        data={selectedTask}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default Tasks;
