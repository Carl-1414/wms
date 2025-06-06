import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [errorSettings, setErrorSettings] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    setErrorSettings(null);
    console.log('SettingsContext: fetchSettings CALLED'); 
    try {
      const response = await fetch('http://localhost:3000/api/settings/general', {
        method: 'GET', 
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate', 
          'Pragma': 'no-cache', 
          'Expires': '0' 
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('SettingsContext: fetchSettings API response DATA:', data); 
      setSettings(data); 
    } catch (err) {
      console.error('SettingsContext: fetchSettings FAILED:', err); 
      setErrorSettings(err.message || 'Failed to load settings');
      setSettings({}); 
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refreshSettings = useCallback(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loadingSettings, errorSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
