import React, { useState, useEffect, useCallback } from 'react';
import { Mail, CheckCircle, CheckSquare, Clock, AlertTriangle, TrendingUp, ArrowRight, RefreshCw, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

const Dashboard = ({ setActivePage = () => {}, onOpenChat = () => {} }) => {
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
  const [syncProgress, setSyncProgress] = useState({ processedThreads: 0, totalThreads: 0 });

  const fetchData = useCallback(async () => {
    try {
      const userId = user?.id || user?.sub;
      if (!userId) return;
      
      const [tasksRes, followupsRes, threadsRes] = await Promise.all([
        fetch(`${API_BASE}/api/tasks?userId=${userId}`),
        fetch(`${API_BASE}/api/followups?userId=${userId}`),
        fetch(`${API_BASE}/api/threads?userId=${userId}`)
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
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let pollInterval;
    if (isSyncing) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/sync/progress`);
          const progress = await res.json();
          setSyncProgress(progress);
        } catch (err) {
          console.error('Failed to poll progress:', err);
        }
      }, 1000);
    }
    return () => clearInterval(pollInterval);
  }, [isSyncing]);

  useEffect(() => {
    const shouldSync = new URLSearchParams(window.location.search).get('sync') === 'true';
    if (shouldSync) {
      handleManualSync();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s instead of 10s for better perf
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncProgress({ processedThreads: 0, totalThreads: 0 });
    
    try {
      const userId = user?.id || user?.sub;
      const res = await fetch(`${API_BASE}/api/sync/manual?userId=${userId}`, { method: 'POST' });
      if (res.ok) {
        await fetchData();
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
          width: '100%',
          height: '100dvh',
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(40px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2147483647,
          overflow: 'hidden',
          margin: 0,
          padding: 0
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center',
            width: '90%',
            maxWidth: '500px',
          }}>
            <div style={{ 
              position: 'relative', 
              width: '180px', 
              height: '180px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '32px' 
            }}>
              <div style={{ 
                position: 'absolute', 
                width: '100%', 
                height: '100%', 
                borderRadius: '50%', 
                border: '4px solid var(--primary)',
                animation: 'pulse 2.5s ease-in-out infinite',
                boxShadow: '0 0 40px rgba(37, 99, 235, 0.2)',
                boxSizing: 'border-box'
              }} />
              <RefreshCw size={80} className="animate-spin" style={{ color: 'var(--primary)', position: 'relative', zIndex: 2 }} />
            </div>
          
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '900', 
              marginBottom: '12px', 
              letterSpacing: '-0.03em',
              color: 'var(--text-main)'
            }}>
              Syncing Intelligence
            </h2>
            
            <p style={{ 
              color: 'var(--text-muted)', 
              fontSize: '1.1rem', 
              marginBottom: '48px',
              maxWidth: '400px'
            }}>
              Pingor is analyzing your communications to extract high-priority tasks and insights.
            </p>

            <div style={{ width: '100%', background: 'rgba(0,0,0,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ 
                width: `${syncProgress.totalThreads > 0 ? (syncProgress.processedThreads / syncProgress.totalThreads) * 100 : 0}%`, 
                background: 'var(--primary)', 
                height: '100%', 
                transition: 'width 0.4s ease-out',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}></div>
            </div>
            
            <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Extracting {syncProgress.processedThreads} / {syncProgress.totalThreads} Items
            </div>
          </div>
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
          <div key={i} 
               className="card clickable" 
               onClick={() => {
                 if (i === 0) setActivePage('Inbox');
                 else if (i === 1) setActivePage('Tasks');
                 else if (i === 2) setActivePage('Follow-ups');
                 else if (i === 3) {
                   window.history.pushState(null, '', '?filter=urgent');
                   setActivePage('Tasks');
                 }
               }}
               style={{ 
                 borderLeft: `none`, 
                 borderBottom: `4px solid ${stat.color}`,
                 display: 'flex', 
                 flexDirection: 'column', 
                 justifyContent: 'center',
                 alignItems: 'center',
                 gap: '12px',
                 padding: '32px 20px',
                 textAlign: 'center'
               }}>
            <div className="icon-container" style={{ 
              background: `${stat.color}15`, 
              color: stat.color, 
              width: '56px', 
              height: '56px',
              borderRadius: '16px',
              marginBottom: '4px'
            }}>
              {stat.icon && React.cloneElement(stat.icon, { size: 24 })}
            </div>
            <div>
              <div style={{ 
                fontSize: '0.85rem', 
                fontWeight: '800', 
                color: 'var(--text-muted)', 
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {stat.label}
              </div>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: '900', 
                color: 'var(--text-main)',
                lineHeight: '1.2'
              }}>
                {stat.value}
              </div>
            </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div className="timeline-time">{thread.sender || 'Unknown'} &bull; {new Date(thread.lastUpdated).toLocaleDateString()}</div>
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
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--primary)', 
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                      className="hover-bg-primary-light"
                      title="Chat with Pingor"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
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

