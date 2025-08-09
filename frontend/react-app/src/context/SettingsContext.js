import React, { createContext, useContext, useMemo, useState } from 'react';
import { defaultSettings, loadSettings, saveSettings, formatMoney } from '../config/settings';

const SettingsContext = createContext({
  settings: defaultSettings,
  setSettings: () => {},
  formatMoney: (x) => `${x}`,
});

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(loadSettings());

  const setSettings = (updater) => {
    setSettingsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveSettings(next);
      return next;
    });
  };

  const value = useMemo(() => ({ settings, setSettings, formatMoney: (x) => formatMoney(x, settings) }), [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
