import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Tasks from './pages/Tasks';
import FollowUps from './pages/FollowUps';
import ChatHistory from './pages/ChatHistory';
import FloatingChat from './components/FloatingChat';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import { Bot, MessageSquare } from 'lucide-react';
import { useRipple } from './utils/useRipple';

function App() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  
  useRipple();

  useEffect(() => {
    if (darkMode) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [darkMode]);

  const renderContent = () => {
    switch(activePage) {
      case 'Dashboard': return <Dashboard setActivePage={setActivePage} />;
      case 'Inbox': return <Inbox />;
      case 'Tasks': return <Tasks setActivePage={setActivePage} />;
      case 'Follow-ups': return <FollowUps setActivePage={setActivePage} />;
      case 'Chat History': return (
        <ChatHistory 
          onOpenChat={(id) => {
            setActiveChatId(id || null);
            setIsChatOpen(true);
          }} 
        />
      );
      case 'Settings': return <Settings />;
      default: return <Dashboard setActivePage={setActivePage} />;
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      <div className="main-content">
        <Navbar 
          activePage={activePage} 
          darkMode={darkMode} 
          toggleDarkMode={() => setDarkMode(!darkMode)} 
        />
        
        <div className="content-area">
          <div key={activePage} className="fade-enter fade-enter-active">
            {renderContent()}
          </div>
        </div>

        {(!isChatOpen) && (
          <div className="fab" onClick={() => { setActiveChatId(null); setIsChatOpen(true); }} title="Open Pingor">
            <MessageSquare size={28} />
          </div>
        )}
        
        <FloatingChat 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          chatId={activeChatId}
        />
      </div>
    </div>
  );
}

export default App;
