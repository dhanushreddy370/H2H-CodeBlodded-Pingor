import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfilePopup from './ProfilePopup';

const Navbar = ({ activePage, setActivePage, darkMode, toggleDarkMode }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user && showNotifications) {
      fetch(`http://localhost:5000/api/tasks?userId=${user.sub}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // grab the latest 3 pending tasks as notifications
            setNotifications(data.filter(t => t.status !== 'done').slice(0, 3));
          }
        })
        .catch(err => console.error("Could not fetch notifications:", err));
    }
  }, [user, showNotifications]);

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
    <div className="navbar glass">
      <div className="scroll-progress-container">
        <div className="scroll-progress-bar" style={{ width: `${scrollWidth}%` }}></div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1, paddingLeft: '8px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.02em', minWidth: '200px', transition: 'all 0.3s' }}>{activePage}</h2>
      </div>
      
      <div className="navbar-user">
        <div style={{ position: 'relative' }}>
          <div className="icon-container" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} color="var(--text-muted)" />
            {notifications.length > 0 && (
              <div style={{ position: 'absolute', top: '0px', right: '0px', background: 'var(--primary)', color: 'white', width: '16px', height: '16px', border: '2px solid var(--bg-card)', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {notifications.length}
              </div>
            )}
          </div>
          
          {showNotifications && (
            <div className="dropdown-menu" style={{
              position: 'absolute', top: '50px', right: '0', width: '320px',
              zIndex: 100, padding: '16px 0'
            }}>
              <div style={{ padding: '0 20px 12px', fontWeight: '700', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>Recent Actions Items</div>
              {notifications.length > 0 ? notifications.map((n, i) => (
                <div key={i} className="email-item" style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem', padding: '12px 20px' }}>
                  <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>AI: </span> {n.action}
                </div>
              )) : (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No new tasks to review!</div>
              )}
            </div>
          )}
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px' }}>
          <div 
            onClick={() => setShowProfile(!showProfile)} 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.name || 'User'}</span>
            {user?.picture ? (
              <img src={user.picture} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            ) : (
              <div className="avatar" style={{ background: 'var(--primary)', color: 'white' }}>{(user?.name || 'U').charAt(0).toUpperCase()}</div>
            )}
          </div>
          
          <ProfilePopup isOpen={showProfile} onClose={() => setShowProfile(false)} setActivePage={setActivePage} />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
