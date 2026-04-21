import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Tasks from './pages/Tasks';
import FollowUps from './pages/FollowUps';
import ChatHistory from './pages/ChatHistory';
import LoginPage from './pages/LoginPage';
import ChatPopup from './components/ChatPopup';
import { Bot, MessageSquare } from 'lucide-react';
import { useRipple } from './utils/useRipple';

function App() {
  const [user, setUser] = useState(null); // Auth State
  const [activePage, setActivePage] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  useRipple();

  useEffect(() => {
    if (darkMode) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [darkMode]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const renderContent = () => {
    switch(activePage) {
      case 'Dashboard': return <Dashboard setActivePage={setActivePage} />;
      case 'Inbox': return <Inbox />;
      case 'Tasks': return <Tasks setActivePage={setActivePage} />;
      case 'Follow-ups': return <FollowUps setActivePage={setActivePage} />;
      case 'Chat History': return <ChatHistory />;
      default: return <Dashboard setActivePage={setActivePage} />;
    }
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
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
          user={user}
        />
        
        <div className="content-area">
          <div key={activePage} className="fade-enter fade-enter-active">
            {renderContent()}
          </div>
        </div>

        {/* Floating Chat Popup */}
        <ChatPopup 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          user={user}
        />

        {/* FAB Button */}
        {!isChatOpen && (
          <div className="fab" onClick={() => setIsChatOpen(true)} title="Chat with Pingor">
            <MessageSquare size={28} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
