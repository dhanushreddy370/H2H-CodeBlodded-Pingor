import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Inbox, CheckSquare, Clock, Bot, Menu, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activePage, setActivePage, isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    const fetchDraftCount = async () => {
      try {
        const userId = user?.id || user?.sub;
        if (!userId) return;
        const res = await fetch(`http://localhost:5000/api/followups/draft-count?userId=${userId}`);
        const data = await res.json();
        setDraftCount(data.count || 0);
      } catch (err) {
        console.error('Failed to fetch draft count:', err);
      }
    };

    fetchDraftCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDraftCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Inbox', icon: <Inbox size={20} /> },
    { name: 'Tasks', icon: <CheckSquare size={20} /> },
    { name: 'Follow-ups', icon: <Clock size={20} />, badge: draftCount > 0 ? draftCount : null },
    { name: 'Chat History', icon: <Bot size={20} /> },
    { name: 'Settings', icon: <SettingsIcon size={20} /> }
  ];

  return (
    <div className={`sidebar glass ${isOpen ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <Menu 
          size={24} 
          style={{ cursor: 'pointer', flexShrink: 0, color: 'var(--primary)' }} 
          onClick={() => setIsOpen(!isOpen)} 
        />
        {isOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', whiteSpace: 'nowrap' }}>
            <Bot size={24} color="var(--primary)" />
            <span>Pingor</span>
          </div>
        )}
      </div>
      <div className="nav-links">
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
            {isOpen && <span className="nav-label">{item.name}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
