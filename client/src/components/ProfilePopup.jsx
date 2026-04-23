import React from 'react';
import { User, LogOut, Settings, Briefcase, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfilePopup = ({ isOpen, onClose, setActivePage }) => {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <>
      <div 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} 
        onClick={onClose} 
      />
      <div style={{
        position: 'absolute',
        top: '60px',
        right: '0',
        width: 'min(320px, 90vw)',
        background: 'var(--bg-card)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        border: '1px solid var(--border)',
        zIndex: 1000,
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease'
      }}>
        <div style={{ padding: '32px 24px', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {user?.picture ? (
            <img src={user.picture} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid var(--bg-card)' }} />
          ) : (
            <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem', background: 'var(--primary)', color: 'white' }}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{user?.name || 'User'}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
        </div>

        <div style={{ padding: '16px' }}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <Briefcase size={18} /> {user?.jobRole || 'Set Job Role'}
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <Building size={18} /> {user?.company || 'Set Company'}
          </div>
          
          <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }} />
          
          <div className="nav-item" onClick={() => { setActivePage('Contacts'); onClose(); }} style={{ padding: '12px 16px', borderRadius: '12px' }}>
            <User size={18} /> Contacts
          </div>
          <div className="nav-item" style={{ padding: '12px 16px', borderRadius: '12px' }}>
            <Settings size={18} /> Account Settings
          </div>
          <div className="nav-item" onClick={logout} style={{ padding: '12px 16px', borderRadius: '12px', color: '#ef4444' }}>
            <LogOut size={18} /> Sign Out
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePopup;
