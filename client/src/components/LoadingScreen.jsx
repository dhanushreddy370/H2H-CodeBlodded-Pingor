import React from 'react';
import Lottie from 'lottie-react';
import { Bot } from 'lucide-react';

const LoadingScreen = () => {
  // A beautiful abstract loading animation
  const loadingAnimationUrl = "https://assets9.lottiefiles.com/packages/lf20_p8bfn5to.json";

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100vw', 
      background: 'var(--bg-primary)', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '24px'
    }}>
      <div style={{ width: '300px', height: '300px' }}>
        <Lottie 
          animationData={null} // We'll fetch it or use a simpler one if URL fails
          path={loadingAnimationUrl}
          loop={true} 
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Bot className="animate-spin" size={24} color="var(--primary)" />
        <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '0.05em' }}>
          PINGOR IS SYNCING...
        </span>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Analyzing your communication intelligence
      </p>
    </div>
  );
};

export default LoadingScreen;
