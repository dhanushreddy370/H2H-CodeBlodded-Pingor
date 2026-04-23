import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Inbox, CheckSquare, Clock, Bot, Menu, User, Settings as SettingsIcon, Cpu, ShieldCheck, AlertTriangle, Users, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

const Sidebar = ({ activePage, setActivePage, isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const [draftCount, setDraftCount] = useState(0);
  const [ollamaStatus, setOllamaStatus] = useState('loading'); // loading, online, offline, error

  useEffect(() => {
    const fetchDraftCount = async () => {
      try {
        const userId = user?.id || user?.sub;
        if (!userId) return;
        const res = await fetch(`${API_BASE}/api/followups/draft-count?userId=${userId}`);
        const data = await res.json();
        setDraftCount(data.count || 0);
      } catch (err) {
        console.error('Failed to fetch draft count:', err);
      }
    };

    const checkOllamaStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status/ollama`);
        const data = await res.json();
        if (data.status === 'online') {
          setOllamaStatus('online');
        } else {
          setOllamaStatus('offline');
        }
      } catch (err) {
        setOllamaStatus('error');
      }
    };

    fetchDraftCount();
    checkOllamaStatus();
    
    const countInterval = setInterval(fetchDraftCount, 30000);
    const statusInterval = setInterval(checkOllamaStatus, 60000);
    
    return () => {
      clearInterval(countInterval);
      clearInterval(statusInterval);
    };
  }, [user]);

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Inbox', icon: <Inbox size={20} /> },
    { name: 'Tasks', icon: <CheckSquare size={20} /> },
    { name: 'Follow-ups', icon: <Clock size={20} />, badge: draftCount > 0 ? draftCount : null },
    { name: 'Contacts', icon: <Users size={20} /> },
    { name: 'Chat History', icon: <History size={20} /> },
    { name: 'Settings', icon: <SettingsIcon size={20} /> }
  ];

  const getStatusInfo = () => {
    switch (ollamaStatus) {
      case 'online': return { color: '#10b981', label: 'AI Online', icon: <ShieldCheck size={14} /> };
      case 'offline': return { color: '#f59e0b', label: 'AI Offline', icon: <AlertTriangle size={14} /> };
      case 'error': return { color: '#ef4444', label: 'AI Error', icon: <AlertTriangle size={14} /> };
      default: return { color: '#94a3b8', label: 'Checking AI...', icon: <Cpu size={14} /> };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`sidebar glass ${isOpen ? 'expanded' : 'collapsed'}`} style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="sidebar-header">
        <Menu 
          size={24} 
          style={{ cursor: 'pointer', flexShrink: 0, color: 'var(--primary)' }} 
          onClick={() => setIsOpen(!isOpen)} 
        />
        <img 
          src="/assets/pingor_banner.png" 
          alt="Pingor" 
          style={{ 
            width: isOpen ? '136px' : '44px',
            height: '44px', 
            borderRadius: '8px',
            objectFit: 'contain',
            marginLeft: isOpen ? '12px' : '8px',
            flexShrink: 0,
            background: 'transparent'
          }} 
        />
      </div>

      <div className="nav-links" style={{ flex: 1 }}>
        {navItems.map(item => (
          <div
            key={item.name}
            className={`nav-item ${activePage === item.name ? 'active' : ''}`}
            onClick={() => setActivePage(item.name)}
            data-tooltip={item.name}
          >
            <div className="icon-container">
              {item.icon}
              {item.badge && (
                <div className="notification-badge" style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  minWidth: '15px',
                  textAlign: 'center'
                }}>
                  {item.badge}
                </div>
              )}
            </div>
            {isOpen && <span className="nav-label" style={{ fontWeight: 700 }}>{item.name}</span>}
          </div>
        ))}
      </div>

      <div className="sidebar-footer" style={{ padding: '20px', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          padding: isOpen ? '12px 16px' : '0',
          background: isOpen ? 'rgba(255,255,255,0.5)' : 'transparent',
          borderRadius: '14px',
          transition: 'all 0.3s'
        }}>
          <div style={{ 
            width: isOpen ? '10px' : '12px', 
            height: isOpen ? '10px' : '12px', 
            borderRadius: '50%', 
            background: statusInfo.color,
            boxShadow: `0 0 10px ${statusInfo.color}44`,
            flexShrink: 0,
            margin: isOpen ? '0' : '0 auto'
          }} />
          {isOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {statusInfo.icon} {statusInfo.label}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ollama v0.1.32</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

