import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, Clock, CheckCircle, ChevronRight, User, ClipboardList, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DetailModal from '../components/DetailModal';
import { GooeyInput } from '../components/ui/GooeyInput';
import CustomSelect from '../components/ui/CustomSelect';
import { API_BASE } from '../config';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [prioritySort, setPrioritySort] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTasks = useCallback(async () => {
    const userId = user?.userId || user?.id || user?.sub;
    if (!userId) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const isUrgentFilter = params.get('filter') === 'urgent';
    
    try {
      let url = `${API_BASE}/api/tasks?userId=${userId}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (prioritySort) url += `&priority=${prioritySort}`;
      
      const res = await fetch(url);
      let data = await res.json();
      if (!Array.isArray(data)) data = [];
      
      if (isUrgentFilter) {
        data = data.filter(t => t.priority >= 4);
      }
      
      setTasks(data);
    } catch(err) { 
      console.error(err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter, prioritySort]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 20000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const openTask = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleUpdate = (updatedTask) => {
    setTasks(prev => {
      const filtered = prev.filter(t => t._id !== updatedTask._id);
      const newTasks = [...filtered, updatedTask];
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

  const filteredTasks = tasks.filter((t) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const actionText = t.action || t.subject || t.title || '';
    const senderText = t.sender || '';
    return (
      actionText.toLowerCase().includes(normalizedSearch) ||
      senderText.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <div className="tasks-page">
      <div style={{ marginBottom: '24px' }}>
        <GooeyInput 
          placeholder="Search tasks..." 
          className="search-expand-container" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="card" style={{ padding: '20px', marginBottom: '24px', zIndex: 10, overflow: 'visible', background: '#f8fafc', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <CustomSelect 
              value={statusFilter} 
              onChange={setStatusFilter} 
              options={[
                { value: '', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'done', label: 'Done' }
              ]}
              placeholder="Status"
            />
            
            <CustomSelect 
              value={prioritySort} 
              onChange={setPrioritySort} 
              options={[
                { value: '', label: 'Sort Priority' },
                { value: 'desc', label: 'High to Low' },
                { value: 'asc', label: 'Low to High' }
              ]}
              placeholder="Priority"
            />
          </div>
          <button className="button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px' }} onClick={() => openTask({})}>
            <Plus size={20} /> New Task
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '24px' }}>
        {loading && tasks.length === 0 ? (
          <div style={{ padding: '40px' }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton" style={{ height: '70px', marginBottom: '12px', borderRadius: '16px' }}></div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ padding: '100px 40px', textAlign: 'center' }}>
            <div style={{ width: '120px', height: '120px', background: '#f1f5f9', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
              <ClipboardList size={60} style={{ color: 'var(--primary)', opacity: 0.2 }} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px', color: 'var(--text-main)' }}>You're all caught up!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px', lineHeight: 1.6 }}>
              {searchTerm ? "No tasks match your search criteria. Try a different term or clear filters." : "No pending tasks found. Pingor will automatically extract tasks from your emails as they arrive."}
            </p>
            {!searchTerm && (
              <button className="button-secondary" onClick={() => openTask({})}>
                <Plus size={18} /> Add Manual Task
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}></th>
                  <th>Action Required</th>
                  <th>Assignee</th>
                  <th>Deadline</th>
                  <th>Priority</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr 
                    key={task._id} 
                    onClick={() => openTask(task)} 
                    className={task.status === 'done' ? 'task-done' : ''}
                    style={{ opacity: task.status === 'done' ? 0.6 : 1, cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ 
                        width: '24px', height: '24px', borderRadius: '8px', 
                        border: '2px solid var(--border)',
                        background: task.status === 'done' ? 'var(--primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                        transition: 'all 0.2s'
                      }}>
                        {task.status === 'done' && <CheckCircle size={16} />}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1rem' }}>
                        {task.action || task.subject || task.title || 'Untitled Task'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
                        {task.sender || 'Manual Task'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {task.assignees?.length > 0 ? task.assignees.map((a, idx) => (
                          <div key={a._id || idx} className="avatar" title={a.name} style={{ width: '32px', height: '32px', fontSize: '0.8rem', borderRadius: '10px' }}>
                            {a.name ? a.name.charAt(0) : '?'}
                          </div>
                        )) : (
                          <div className="avatar" style={{ background: '#f1f5f9', color: '#64748b', width: '32px', height: '32px', borderRadius: '10px' }}>
                            <User size={16} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        fontSize: '0.9rem', 
                        fontWeight: 600,
                        color: task.status !== 'done' && task.deadline && new Date(task.deadline) < new Date() ? '#ef4444' : 'var(--text-main)' 
                      }}>
                        <Clock size={16} style={{ opacity: 0.5 }} /> {formatDate(task.deadline)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge priority-${task.priority}`} style={{ borderRadius: '8px', padding: '6px 12px', fontWeight: 800, fontSize: '0.7rem' }}>
                        P{task.priority}
                      </span>
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
        data={selectedTask}
        onUpdate={handleUpdate}
        type="task"
      />
    </div>
  );
};

export default Tasks;
