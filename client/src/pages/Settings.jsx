import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Bell, Cpu, Save, CheckCircle, Moon, Sun, BellOff } from 'lucide-react';

const Settings = ({ darkMode, toggleDarkMode }) => {
  const { user, login } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    syncFrequency: '30',
    aiModel: 'llama3.2 (Local)'
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.settings) {
      setSettings(prev => ({ ...prev, ...user.settings }));
    }
  }, [user]);

  const handleToggleNotifications = () => {
    setSettings(prev => ({ ...prev, notifications: !prev.notifications }));
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
      login(updatedUser); // sync local context
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-container">
      
      <div className="grid grid-cols-1" style={{ maxWidth: '800px' }}>
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div className="icon-container" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>App Experience</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configure how Pingor feels and behaves</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Dark Mode Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="icon-container" style={{ background: darkMode ? 'var(--primary)' : 'var(--bg-card)', color: darkMode ? 'white' : 'var(--text-muted)' }}>
                  {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Modern Dark Theme</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Adjust the interface for eye comfort</div>
                </div>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`switch ${darkMode ? 'active' : ''}`}
                style={{ width: '50px', height: '26px', borderRadius: '100px', background: darkMode ? 'var(--primary)' : 'var(--border)', position: 'relative', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}
              >
                <div style={{ position: 'absolute', top: '3px', left: darkMode ? '27px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'all 0.3s' }} />
              </button>
            </div>

            {/* Notifications Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="icon-container" style={{ background: settings.notifications ? 'var(--primary)' : 'var(--bg-card)', color: settings.notifications ? 'white' : 'var(--text-muted)' }}>
                  {settings.notifications ? <Bell size={18} /> : <BellOff size={18} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Real-time Notifications</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Get alerts for new Gmail syncs and tasks</div>
                </div>
              </div>
              <button 
                onClick={handleToggleNotifications}
                className={`switch ${settings.notifications ? 'active' : ''}`}
                style={{ width: '50px', height: '26px', borderRadius: '100px', background: settings.notifications ? 'var(--primary)' : 'var(--border)', position: 'relative', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}
              >
                <div style={{ position: 'absolute', top: '3px', left: settings.notifications ? '27px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'all 0.3s' }} />
              </button>
            </div>

            {/* Sync Frequency */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-muted)' }}>Sync Intelligence Frequency</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {['5', '15', '30', '60'].map(freq => (
                  <button
                    key={freq}
                    onClick={() => setSettings({ ...settings, syncFrequency: freq })}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: settings.syncFrequency === freq ? 'var(--primary)' : 'var(--bg-primary)',
                      color: settings.syncFrequency === freq ? 'white' : 'var(--text-main)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {freq}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: '700', fontSize: '0.9rem' }}>
                <CheckCircle size={18} /> Preferences updated
              </div>
            )}
            <button onClick={handleSave} className="button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px', borderRadius: '16px' }}>
              <Save size={18} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
