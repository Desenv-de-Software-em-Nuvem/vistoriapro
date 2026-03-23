import React, { useEffect, useState } from 'react';

const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [timerId, setTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPopup(true);
      const id = setTimeout(() => setShowPopup(false), 8000);
      setTimerId(id);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      if (timerId) clearTimeout(timerId);
    };
  }, [timerId]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setShowPopup(false));
      if (timerId) clearTimeout(timerId);
    }
  };

  const handleClose = () => {
    setShowPopup(false);
    if (timerId) clearTimeout(timerId);
  };

  if (!showPopup) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        padding: '10px 18px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: 180,
        maxWidth: '80vw',
        fontSize: 15,
      }}
    >
      <span style={{ flex: 1, color: '#333' }}>
        Instale o app!
      </span>
      <button
        onClick={handleInstallClick}
        style={{
          background: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '6px 12px',
          cursor: 'pointer',
          fontSize: 14
        }}
      >
        Instalar
      </button>
      <button
        onClick={handleClose}
        style={{
          background: 'transparent',
          color: '#888',
          border: 'none',
          fontSize: 18,
          cursor: 'pointer',
          marginLeft: 4
        }}
      >
        ×
      </button>
    </div>
  );
};

export default InstallPWAButton;