import React, { createContext, useContext, useEffect, useState } from "react";
import { authFetch } from "../utils/api";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({ currency_symbol: "$" });
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const res = await authFetch("/settings");
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error("Failed to refresh settings:", err);
      throw err;
    }
  };

  useEffect(() => {
    refreshSettings().finally(() => setLoading(false));
  }, []);

  return (
    <SettingsContext.Provider value={{ ...settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};