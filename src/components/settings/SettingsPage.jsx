import React, { useEffect, useState } from "react";
import { Form, Button, Modal } from "react-bootstrap";
import { authFetch } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSettings } from "../../contexts/SettingsContext";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import "./Settings.css";

const Settings = () => {
  const [currency, setCurrency] = useState("$");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();
  const { refreshSettings } = useSettings();

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

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      const res = await authFetch("/settings/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Password changed successfully!");
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to change password.");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="page-container">
      <h2 className="mb-4 fw-bold">Settings</h2>
  
      {/* Preferences Section */}
      <div className="card mb-2">
        <div className="card-header fw-semibold">Preferences</div>
        <div className="card-body">
          <Form>
            <Form.Group className="mb-2">
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
            <Button variant="success" onClick={handleSave}>
              Save Preferences
            </Button>
          </Form>
        </div>
      </div>
  
      {/* Security Section */}
      <div className="card mb-2">
        <div className="card-header fw-semibold">Security</div>
        <div className="card-body">
          <p className="mb-3">Manage your account password here.</p>
          <Button variant="primary" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </Button>
        </div>
      </div>
  
      {/* Account Section */}
      <div className="card mb-3">
        <div className="card-header fw-semibold">Account</div>
        <div className="card-body">
          <p className="mb-3">Click below to log out of your account.</p>
          <Button variant="outline-danger" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
  
      {/* Change Password Modal */}
      <Modal
        show={showPasswordModal}
        onHide={() => setShowPasswordModal(false)}
        size="lg"
        contentClassName="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <div className="input-icon-wrapper">
                <Form.Control
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <span className="input-icon" onClick={() => setShowCurrent((prev) => !prev)}>
                  {showCurrent ? <VscEyeClosed /> : <VscEye />}
                </span>
              </div>
            </Form.Group>
  
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <div className="input-icon-wrapper">
                <Form.Control
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <span className="input-icon" onClick={() => setShowNew((prev) => !prev)}>
                  {showNew ? <VscEyeClosed /> : <VscEye />}
                </span>
              </div>
            </Form.Group>
  
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <div className="input-icon-wrapper">
                <Form.Control
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span className="input-icon" onClick={() => setShowConfirm((prev) => !prev)}>
                  {showConfirm ? <VscEyeClosed /> : <VscEye />}
                </span>
              </div>
            </Form.Group>
  
            <Button variant="primary" onClick={handleChangePassword}>
              Save Password
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Settings;