import React from 'react';
import { LayoutDashboard, Inbox, CheckSquare, Clock, Bot, Menu, Settings as SettingsIcon } from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, isOpen, setIsOpen }) => {
  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Inbox', icon: <Inbox size={20} /> },
    { name: 'Tasks', icon: <CheckSquare size={20} /> },
    { name: 'Follow-ups', icon: <Clock size={20} /> },
    { name: 'Chat History', icon: <Bot size={20} /> },
    { name: 'Settings', icon: <SettingsIcon size={20} /> }
  ];

  return (
    <div className={`sidebar ${isOpen ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <Menu 
          size={24} 
          style={{ cursor: 'pointer', flexShrink: 0, color: 'var(--primary)' }} 
          onClick={() => setIsOpen(!isOpen)} 
        />
        {isOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', whiteSpace: 'nowrap' }}>
            <Bot size={24} color="var(--primary)" />
            <span>Pingor AI</span>
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
            <div className="icon-container">{item.icon}</div>
            {isOpen && <span className="nav-label">{item.name}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
