import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, Bell, Save, CheckCircle, Moon, Sun, 
  User, RefreshCw, LogOut, Mail, Clock, Layout, 
  Check, AlertCircle, Loader2
} from 'lucide-react';

const Settings = ({ darkMode, toggleDarkMode }) => {
  const { user, login, logout } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    dailyDigest: true,
    followupReminders: true,
    syncFrequency: '30',
    viewMode: 'comfortable'
  });
  const [saved, setSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (user?.settings) {
      setSettings(prev => ({ ...prev, ...user.settings }));
    }
  }, [user]);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      const userId = user?.id || user?.sub;
      const res = await fetch('http://localhost:5000/api/users/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, settings })
      });
      const updatedUser = await res.json();
      login(updatedUser); 
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const userId = user?.id || user?.sub;
      await fetch(`http://localhost:5000/api/sync/manual?userId=${userId}`, { method: 'POST' });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsSyncing(false), 2000);
    }
  };

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', marginTop: '16px' }}>
      <div className="icon-container" style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '40px', height: '40px' }}>
        <Icon size={18} />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{title}</h3>
        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
    </div>
  );


  const SettingRow = ({ label, description, children }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '12px' }}>
      <div style={{ flex: 1, paddingRight: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{label}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="settings-container">
      <div className="grid grid-cols-1" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* 1. Notifications */}
        <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
          <SectionHeader 
            icon={Bell} 
            title="Notifications" 
            subtitle="Configure how and when you receive intelligence alerts" 
          />
          
          <SettingRow label="Daily Digest" description="Receive a morning summary of high-priority tasks">
            <button 
              onClick={() => handleToggle('dailyDigest')}
              className={`switch ${settings.dailyDigest ? 'active' : ''}`}
            >
              <div className="switch-handle" />
            </button>
          </SettingRow>

          <SettingRow label="Follow-up Reminders" description="Get notified when a thread hasn't received a reply">
            <button 
              onClick={() => handleToggle('followupReminders')}
              className={`switch ${settings.followupReminders ? 'active' : ''}`}
            >
              <div className="switch-handle" />
            </button>
          </SettingRow>
        </div>

        {/* 2. Sync Settings */}
        <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
          <SectionHeader 
            icon={RefreshCw} 
            title="Sync Settings" 
            subtitle="Control the frequency of Gmail analysis" 
          />
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-muted)' }}>Sync Intelligence Frequency</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <button
                onClick={() => setSettings({ ...settings, syncFrequency: '60' })}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: settings.syncFrequency === '60' ? 'var(--primary)' : 'var(--bg-primary)',
                  color: settings.syncFrequency === '60' ? 'white' : 'var(--text-main)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Clock size={16} /> Hourly Automated
              </button>
              <button
                onClick={() => setSettings({ ...settings, syncFrequency: 'manual' })}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: settings.syncFrequency === 'manual' ? 'var(--primary)' : 'var(--bg-primary)',
                  color: settings.syncFrequency === 'manual' ? 'white' : 'var(--text-main)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Shield size={16} /> Manual Trigger Only
              </button>
            </div>
          </div>

          <button 
            className="button" 
            onClick={handleSyncNow}
            disabled={isSyncing}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            {isSyncing ? 'Synchronizing Archive...' : 'Force Sync Now'}
          </button>
        </div>

        {/* 3. UI Preferences */}
        <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
          <SectionHeader 
            icon={Layout} 
            title="UI Preferences" 
            subtitle="Customize the interface to suit your workflow" 
          />
          
          <SettingRow label="Dark Appearance" description="Switch between high-contrast light and modern dark themes">
            <button 
              onClick={toggleDarkMode}
              className={`switch ${darkMode ? 'active' : ''}`}
            >
              <div className="switch-handle" />
            </button>
          </SettingRow>

          <SettingRow label="View Density" description="Adjust spacing to see more content at once">
            <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setSettings({...settings, viewMode: 'compact'})}
                style={{ 
                  padding: '6px 16px', borderRadius: '8px', border: 'none', 
                  background: settings.viewMode === 'compact' ? 'var(--primary)' : 'transparent',
                  color: settings.viewMode === 'compact' ? 'white' : 'var(--text-muted)',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                }}
              >Compact</button>
              <button 
                onClick={() => setSettings({...settings, viewMode: 'comfortable'})}
                style={{ 
                  padding: '6px 16px', borderRadius: '8px', border: 'none', 
                  background: settings.viewMode === 'comfortable' ? 'var(--primary)' : 'transparent',
                  color: settings.viewMode === 'comfortable' ? 'white' : 'var(--text-muted)',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                }}
              >Comfortable</button>
            </div>
          </SettingRow>
        </div>

        {/* 4. Account & Session */}
        <div className="card" style={{ padding: '32px', marginBottom: '40px' }}>
          <SectionHeader 
            icon={User} 
            title="Account & Session" 
            subtitle="Manage your connected identities and active sessions" 
          />
          
          <SettingRow label="Connected Gmail" description={user?.email || 'No email attached'}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              {user?.gmailConnected ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: '700', fontSize: '0.85rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></div>
                    Connected
                  </div>
                  <button 
                    onClick={() => alert('Gmail disconnection will disable Pingor Intelligence. Proceed via Google Account settings.')} 
                    className="hover-text-primary" 
                    style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Disconnect Account
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '700', fontSize: '0.85rem' }}>
                  <AlertCircle size={14} /> Not Linked
                </div>
              )}
            </div>
          </SettingRow>

          <SettingRow label="Session Status" description="Last synchronized 4 minutes ago">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem' }}>
              <AlertCircle size={14} /> Active
            </div>
          </SettingRow>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-start' }}>
            <button 
              onClick={logout} 
              className="button-secondary" 
              style={{ color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}
            >
              <LogOut size={16} /> Sign Out of Pingor
            </button>
          </div>
        </div>

        {/* Floating Save Bar */}
        <div className="glass" style={{ 
          position: 'sticky', bottom: '24px', left: 0, right: 0, 
          padding: '16px 24px', borderRadius: '24px', zIndex: 100,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.05)', border: '1px solid var(--glass-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {saved ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: '700' }}>
                <CheckCircle size={20} /> Changes saved successfully
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <Shield size={18} /> You have unsaved changes
              </div>
            )}
          </div>
          <button 
            onClick={handleSave} 
            className="button" 
            style={{ padding: '12px 40px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
          >
            <Save size={18} style={{ marginRight: '8px' }} /> Save Preferences
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
