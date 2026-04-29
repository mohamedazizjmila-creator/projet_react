import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('sotavi_settings');
    return saved ? JSON.parse(saved) : {
      language: 'fr',
      theme: 'dark',
      font: 'Inter',
      animations: true,
      compactMode: false,
    };
  });

  useEffect(() => {
    localStorage.setItem('sotavi_settings', JSON.stringify(settings));
    
    // Apply font family to body
    document.body.style.fontFamily = `"${settings.font}", sans-serif`;
    
    // Apply RTL if Arabic
    document.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
