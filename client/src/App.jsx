import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Tasks from './pages/Tasks';
import FollowUps from './pages/FollowUps';
import ChatPage from './pages/ChatPage';
import { Bot, MessageSquare } from 'lucide-react';
import { useRipple } from './utils/useRipple';

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
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
      case 'Pingor Chat': return <ChatPage />;
      default: return <Dashboard setActivePage={setActivePage} />;
    }
  };

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

        {activePage !== 'Pingor Chat' && (
          <div className="fab" onClick={() => setActivePage('Pingor Chat')} title="Open Pingor">
            <MessageSquare size={28} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
