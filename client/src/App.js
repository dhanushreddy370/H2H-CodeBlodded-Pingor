import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Tasks from './pages/Tasks';
import FollowUps from './pages/FollowUps';
import ChatHistory from './pages/ChatHistory';
import Contacts from './pages/Contacts';
import FloatingChat from './components/FloatingChat';
import Settings from './pages/Settings';
import Login from './pages/Login';
import LoadingScreen from './components/LoadingScreen';
import DailyDigest from './pages/DailyDigest';
import SmartSearch from './pages/SmartSearch';
import { useAuth } from './context/AuthContext';
import { useRipple } from './utils/useRipple';

function App() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [initialChatContext, setInitialChatContext] = useState(null);

  useRipple();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [darkMode]);

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return (
          <Dashboard
            setActivePage={setActivePage}
            onOpenChat={(context) => {
              setInitialChatContext(context);
              setIsChatOpen(true);
            }}
          />
        );
      case 'Inbox':
        return <Inbox />;
      case 'Daily Digest':
        return <DailyDigest onBack={() => setActivePage('Dashboard')} />;
      case 'Smart Search':
        return <SmartSearch onBack={() => setActivePage('Dashboard')} />;
      case 'Tasks':
        return <Tasks />;
      case 'Follow-ups':
        return (
          <FollowUps
            onOpenChat={(context) => {
              setActiveChatId(null);
              setInitialChatContext(context);
              setIsChatOpen(true);
            }}
          />
        );
      case 'Chat History':
        return (
          <ChatHistory
            onOpenChat={(id) => {
              setActiveChatId(id || null);
              setIsChatOpen(true);
            }}
          />
        );
      case 'Contacts':
        return <Contacts />;
      case 'Settings':
        return <Settings darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {isSidebarOpen && window.innerWidth <= 768 && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(2px)',
            zIndex: 9
          }}
        />
      )}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="main-content">
        <Navbar
          activePage={activePage}
          setActivePage={setActivePage}
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(!darkMode)}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div className="content-area" style={{ flex: 1 }}>
          <div key={activePage} className="fade-enter fade-enter-active">
            {renderContent()}
          </div>
        </div>

        {!isChatOpen && (
          <div
            className="fab"
            onClick={() => {
              setActiveChatId(null);
              setIsChatOpen(true);
            }}
            title="Open Pingor"
          >
            <img
              src="/assets/pingor_mark.svg"
              alt="Open Pingor"
              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
            />
          </div>
        )}

        <FloatingChat
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setInitialChatContext(null);
          }}
          chatId={activeChatId}
          initialContext={initialChatContext}
        />
      </div>
    </div>
  );
}

export default App;
