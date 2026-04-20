import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, Search } from 'lucide-react';
import { GooeyInput } from './ui/GooeyInput';

const Navbar = ({ activePage, darkMode, toggleDarkMode }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [scrollWidth, setScrollWidth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const contentArea = document.querySelector('.content-area');
      if (contentArea) {
        const scrollPercent = (contentArea.scrollTop / (contentArea.scrollHeight - contentArea.clientHeight)) * 100;
        setScrollWidth(scrollPercent);
      }
    };
    
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
      contentArea.addEventListener('scroll', handleScroll);
    }
    return () => contentArea?.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="navbar">
      <div className="scroll-progress-container">
        <div className="scroll-progress-bar" style={{ width: `${scrollWidth}%` }}></div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', minWidth: '140px' }}>{activePage}</h2>
        <div style={{ marginLeft: '20px', width: '100%', maxWidth: '400px' }}>
          <GooeyInput placeholder="Search everything..." />
        </div>
      </div>
      
      <div className="navbar-user">
        <div className="icon-container" onClick={toggleDarkMode} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </div>
        
        <div style={{ position: 'relative' }}>
          <div className="icon-container" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} color="var(--text-muted)" />
            <div style={{ position: 'absolute', top: '0px', right: '0px', background: 'var(--primary)', color: 'white', width: '16px', height: '16px', border: '2px solid var(--bg-card)', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              3
            </div>
          </div>
          
          {showNotifications && (
            <div style={{
              position: 'absolute', top: '50px', right: '0', width: '300px',
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-hover)', zIndex: 100,
              padding: '16px 0', overflow: 'hidden'
            }}>
              <div style={{ padding: '0 20px 12px', fontWeight: '700', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>Notifications</div>
              <div className="email-item" style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>AI: </span> Draft ready for John Doe
              </div>
              <div className="email-item" style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>AI: </span> Categorized 12 urgent emails
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px' }}>
          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Rithika</span>
          <div className="avatar" style={{ background: 'var(--primary)', color: 'white' }}>R</div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
