import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Tasks from './pages/Tasks';
import FollowUps from './pages/FollowUps';
import AIAssistant from './pages/AIAssistant';
import { Bot } from 'lucide-react';

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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
      case 'Tasks': return <Tasks />;
      case 'Follow-ups': return <FollowUps />;
      case 'AI Assistant': return <AIAssistant />;
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
          {renderContent()}
        </div>

        {activePage !== 'AI Assistant' && (
          <div className="fab" onClick={() => setActivePage('AI Assistant')} title="Open AI Assistant">
            <Bot size={28} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
