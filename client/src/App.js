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
  const [initialChatContext, setInitialChatContext] = useState(null);
  
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
      case 'Dashboard': return <Dashboard setActivePage={setActivePage} onOpenChat={(context) => {
        setInitialChatContext(context);
        setIsChatOpen(true);
      }} />;
      case 'Inbox': return <Inbox />;
      case 'Tasks': return <Tasks />;
      case 'Follow-ups': return (
        <FollowUps 
          onOpenChat={(context) => {
            setActiveChatId(null);
            setInitialChatContext(context);
            setIsChatOpen(true);
          }} 
        />
      );
      case 'Chat History': return (
        <ChatHistory 
          onOpenChat={(id) => {
            setActiveChatId(id || null);
            setIsChatOpen(true);
          }} 
        />
      );
      case 'Contacts': return <Contacts />;
      case 'Settings': return <Settings darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />;
      default: return <Dashboard setActivePage={setActivePage} />;
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
