import React, { useState } from 'react';
import { Bell, Sun, Moon } from 'lucide-react';

const Navbar = ({ activePage, darkMode, toggleDarkMode }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{activePage}</h2>
      </div>
      
      <div className="navbar-user" style={{ position: 'relative' }}>
        <div onClick={toggleDarkMode} style={{ cursor: 'pointer', padding: '8px', color: 'var(--text-muted)' }}>
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </div>
        
        <div style={{ position: 'relative' }}>
          <Bell 
            size={20} 
            color="var(--text-muted)" 
            style={{ cursor: 'pointer', margin: '0 12px' }} 
            onClick={() => setShowNotifications(!showNotifications)}
          />
          {/* Notification Badge */}
          <div style={{ position: 'absolute', top: '-2px', right: '10px', background: 'red', color: 'white', width: '16px', height: '16px', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            3
          </div>

          {showNotifications && (
            <div style={{
              position: 'absolute', top: '40px', right: '0', width: '280px',
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '8px', boxShadow: 'var(--shadow-hover)', zIndex: 100,
              padding: '12px 0'
            }}>
              <div style={{ padding: '0 16px 8px', fontWeight: 'bold', borderBottom: '1px solid var(--border)' }}>Notifications</div>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.85rem' }}>
                <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>AI: </span> Draft ready for John Doe
              </div>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.85rem' }}>
                <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>AI: </span> Categorized 12 urgent emails
              </div>
              <div style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>System: </span> Weekly digest available
              </div>
            </div>
          )}
        </div>

        <span>User</span>
        <div className="avatar">U</div>
      </div>
    </div>
  );
};

export default Navbar;
