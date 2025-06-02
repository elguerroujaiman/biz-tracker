import React, { useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import { authFetch } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const Settings = () => {
  const [currency, setCurrency] = useState("$");
  const [theme, setTheme] = useState("light");
  const navigate = useNavigate();

  // Fetch user settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await authFetch("/settings");
        const data = await res.json();
        if (res.ok) {
          setCurrency(data.currency_symbol || "$");
          setTheme(data.theme || "light");
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
        body: JSON.stringify({ currency_symbol: currency, theme }),
      });
      if (res.ok) {
        toast.success("Settings saved!");
      } else {
        toast.error("Failed to save settings.");
      }
    } catch (err) {
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
    <div className="container mt-4">
      <h3>Settings</h3>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Preferred Currency</Form.Label>
          <Form.Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="$">$ - US Dollar</option>
            <option value="€">€ - Euro</option>
            <option value="dh">dh - Moroccan Dirham</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Theme</Form.Label>
          <Form.Select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
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