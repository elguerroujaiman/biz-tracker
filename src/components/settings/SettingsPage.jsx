import React, { useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import { authFetch } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSettings } from "../../contexts/SettingsContext";

const Settings = () => {
  const [currency, setCurrency] = useState("$");
  const navigate = useNavigate();
  const { refreshSettings } = useSettings();

  // Fetch current settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await authFetch("/settings");
        const data = await res.json();
        if (res.ok) {
          setCurrency(data.currency_symbol || "$");
        } else {
          toast.error("Failed to load settings.");
        }
      } catch (err) {
        toast.error("Error fetching settings.");
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      const res = await authFetch("/settings", {
        method: "PUT",
        body: JSON.stringify({ currency_symbol: currency }),
      });

      if (res.ok) {
        toast.success("Settings saved!");
        try {
          await refreshSettings();
        } catch (err) {
          console.error("Error refreshing settings:", err);
          toast.error("Failed to refresh settings.");
        }
      } else {
        toast.error("Failed to save settings.");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Error saving settings.");
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      sessionStorage.clear();
      localStorage.clear();
      navigate("/signin");
    }
  };

  return (
    <div className="page-container">
      <h3>Settings</h3>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Preferred Currency</Form.Label>
          <Form.Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="custom-input"
          >
            <option value="$">$ - US Dollar</option>
            <option value="€">€ - Euro</option>
            <option value="DH">DH - Moroccan Dirham</option>
          </Form.Select>
        </Form.Group>

        <Button variant="primary" onClick={handleSave}>
          Save Settings
        </Button>
      </Form>

      <hr />

      <Button variant="outline-danger" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  );
};

export default Settings;