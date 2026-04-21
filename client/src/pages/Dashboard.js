import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, CheckSquare, Clock, AlertTriangle, TrendingUp, ArrowRight, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = ({ setActivePage = () => {} }) => {
  const { user } = useAuth();
  const [data, setData] = useState({
    stats: [
      { label: 'Emails', value: '0', icon: <Mail size={18} />, color: '#2563eb' },
      { label: 'Tasks', value: '0', icon: <CheckSquare size={18} />, color: '#166534' },
      { label: 'Followups', value: '0', icon: <Clock size={18} />, color: '#b45309' },
      { label: 'Urgent', value: '0', icon: <AlertTriangle size={18} />, color: '#b91c1c' }
    ],
    threads: [],
    tasks: []
  });
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Return early if user is still loading
      // Fetch data regardless to ensure dummy data shows
      // if (!user?.sub) return;

      try {
        const userId = user?.sub || 'test-user-id';
        const [tasksRes, followupsRes, threadsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/tasks?userId=${userId}`),
          fetch(`http://localhost:5000/api/followups?userId=${userId}`),
          fetch(`http://localhost:5000/api/threads?userId=${userId}`)
        ]);
        
        const tasks = await tasksRes.json();
        const followups = await followupsRes.json();
        const threads = await threadsRes.json();
        
        const urgentCount = [...tasks, ...followups].filter(i => i.priority >= 4).length;

        setData({
          stats: [
            { label: 'Emails', value: threads.length || '0', icon: <Mail size={18} />, color: '#2563eb' },
            { label: 'Tasks', value: tasks.length || '0', icon: <CheckCircle size={18} />, color: '#166534' },
            { label: 'Followups', value: followups.length || '0', icon: <Clock size={18} />, color: '#b45309' },
            { label: 'Urgent', value: urgentCount, icon: <AlertTriangle size={18} />, color: '#b91c1c' }
          ],
          threads: followups.slice(0, 10),
          tasks: tasks.slice(0, 10)
        });
      } catch (err) {
        console.error('Failed to align with backend:', err);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };

    fetchData();
  }, [user]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('http://localhost:5000/api/sync/manual', { method: 'POST' });
      if (res.ok) {
        // Re-run fetchData logic manually
        const [tasksRes, followupsRes, threadsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/tasks?userId=${user?.sub}`),
          fetch(`http://localhost:5000/api/followups?userId=${user?.sub}`),
          fetch(`http://localhost:5000/api/threads?userId=${user?.sub}`)
        ]);
        const tasks = await tasksRes.json();
        const followups = await followupsRes.json();
        const threads = await threadsRes.json();
        const urgentCount = [...tasks, ...followups].filter(i => i.priority >= 4).length;

        setData({
          stats: [
            { label: 'Emails', value: threads.length || '0', icon: <Mail size={18} />, color: '#2563eb' },
            { label: 'Tasks', value: tasks.length || '0', icon: <CheckCircle size={18} />, color: '#166534' },
            { label: 'Followups', value: followups.length || '0', icon: <Clock size={18} />, color: '#b45309' },
            { label: 'Urgent', value: urgentCount, icon: <AlertTriangle size={18} />, color: '#b91c1c' }
          ],
          threads: followups.slice(0, 10),
          tasks: tasks.slice(0, 10)
        });
      }
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <dotlottie-player
          src="https://lottie.host/a0777886-4a6c-4f15-be5d-99a902caa6ae/5chwxQ3WHT.lottie"
          background="transparent"
          speed="1"
          style={{ width: '200px', height: '200px' }}
          loop
          autoplay
        ></dotlottie-player>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {isSyncing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          color: 'white',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{ position: 'relative', marginBottom: '32px' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '4px dashed var(--primary)',
              animation: 'spin 4s linear infinite',
              opacity: 0.3
            }}></div>
            <RefreshCw size={64} className="animate-spin" style={{ color: 'var(--primary)', position: 'relative', zIndex: 1 }} />
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '12px', letterSpacing: '-0.03em' }}>Syncing Intelligence</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', textAlign: 'center', maxWidth: '500px' }}>
            Updating your inbox, prioritizing tasks, and generating AI insights across all communication channels.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '4px' }}>Welcome back, {user?.name || 'User'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>Efficiency score is high today. Here's your status.</p>
        </div>
        <button 
          className="button" 
          onClick={handleManualSync}
          disabled={isSyncing}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            padding: '14px 28px', 
            borderRadius: '16px',
            boxShadow: 'var(--shadow-hover)' 
          }}
        >
          <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Synchronizing...' : 'Sync Now'}
        </button>
      </div>
      
      <div className="ai-summary-block">
        <h3 className="ai-summary-title">
          <TrendingUp size={20} /> Today's Focus
        </h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          Backend sync complete. You have <strong>{data.stats[3].value} urgent items</strong> needing attention. 
          Your AI Assistant has analyzed <strong>{data.threads.length}</strong> follow-up threads for today.
        </p>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: '40px' }}>
        {data.stats.map((stat, i) => (
          <div key={i} className="card clickable" onClick={() => i === 0 ? setActivePage('Inbox') : i === 1 ? setActivePage('Tasks') : i === 2 ? setActivePage('Follow-ups') : null}>
            <div className="stat-label">
              <span className="icon-container" style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</span>
              {stat.label}
            </div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ margin: 0 }}>Follow-up Threads</h3>
            <button className="button" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => setActivePage('Follow-ups')}>View All <ArrowRight size={14} /></button>
          </div>
          <div className="timeline-container">
            {data.threads.length > 0 ? data.threads.map(thread => (
              <div key={thread._id} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thread.subject}</span>
                    <span className={`badge ${thread.priority >= 4 ? 'high' : 'pending'}`} style={{ fontSize: '0.65rem' }}>P{thread.priority}</span>
                  </div>
                  <div className="timeline-time">{thread.sender || 'Unknown'} &bull; {new Date(thread.lastUpdated).toLocaleDateString()}</div>
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>No follow-ups found in backend.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ margin: 0 }}>Pending Tasks</h3>
            <button className="button" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => setActivePage('Tasks')}>Manage <ArrowRight size={14} /></button>
          </div>
          <div className="timeline-container">
            {data.tasks.length > 0 ? data.tasks.map(task => (
              <div key={task._id} className="timeline-item">
                <div className="timeline-dot" style={{ background: task.priority >= 4 ? '#ef4444' : task.priority >= 3 ? '#f59e0b' : '#10b981' }}></div>
                <div className="timeline-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{task.action}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: task.priority >= 4 ? '#ef4444' : task.priority >= 3 ? '#f59e0b' : '#10b981' }}>
                      P{task.priority}
                    </span>
                  </div>
                  <div className="timeline-time">Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</div>
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>No active tasks in backend.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
