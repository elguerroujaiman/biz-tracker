import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authFetch } from "../utils/api";

const SettingsContext = createContext({
  currency_symbol: "$",
  loading: false,
  refreshSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({ currency_symbol: "$" });
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await authFetch("/settings");
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.currency_symbol === "string") {
          setSettings(data);
        }
      }
    } catch (err) {
      console.warn("Could not fetch user settings, using defaults:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ ...settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
