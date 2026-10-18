import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { authFetch } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSettings } from "../../contexts/SettingsContext";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import {
  MdAttachMoney,
  MdSecurity,
  MdPerson,
  MdLogout,
  MdCheck,
  MdLock
} from "react-icons/md";

const Settings = () => {
  const [currency, setCurrency]                   = useState("$");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword]     = useState("");
  const [newPassword, setNewPassword]             = useState("");
  const [confirmPassword, setConfirmPassword]     = useState("");

  const [showCurrent, setShowCurrent]             = useState(false);
  const [showNew, setShowNew]                     = useState(false);
  const [showConfirm, setShowConfirm]             = useState(false);
  const [savingCurrency, setSavingCurrency]       = useState(false);
  const [savingPassword, setSavingPassword]       = useState(false);

  const [user, setUser]                           = useState(null);

  const navigate          = useNavigate();
  const { refreshSettings } = useSettings();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("userDetails");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // fallback
    }

    const fetchSettings = async () => {
      try {
        const res = await authFetch("/settings");
        if (res.ok) {
          const data = await res.json();
          setCurrency(data.currency_symbol || "$");
        }
      } catch (err) {
        console.warn("Could not fetch user settings:", err);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveCurrency = async () => {
    setSavingCurrency(true);
    try {
      const res = await authFetch("/settings", {
        method: "PUT",
        body: JSON.stringify({ currency_symbol: currency }),
      });

      if (res.ok) {
        toast.success("Currency preferences updated!");
        await refreshSettings();
      } else {
        toast.error("Failed to update currency settings.");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Error saving settings.");
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out of your session?")) {
      sessionStorage.clear();
      localStorage.removeItem("token");
      toast.success("Logged out successfully.");
      navigate("/signin");
    }
  };

  const handleChangePassword = async (e) => {
    e?.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 72 || new TextEncoder().encode(newPassword).length > 72) {
      toast.error("New password must be 8 to 72 characters and no more than 72 UTF-8 bytes.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
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
        toast.error(data.message || data.error || "Failed to change password.");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      toast.error("Network error while updating password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: "860px" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Store & Account Settings</h1>
          <p className="page-subtitle">
            Configure default currency, update security credentials, and view account profile.
          </p>
        </div>
      </div>

      <div className="d-flex flex-column gap-4">
        {/* Profile Details Card */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title">
              <MdPerson className="panel-icon text-accent" />
              <div>
                <h3>User Profile</h3>
                <span className="text-muted text-sm">Your active administrator account</span>
              </div>
            </div>
          </div>
          <div className="panel-card-body">
            <div className="grid grid-2 gap-3">
              <div>
                <label className="form-label">Full Name / Username</label>
                <div className="font-semibold text-primary">{user?.username || "Store Administrator"}</div>
              </div>
              <div>
                <label className="form-label">Registered Email</label>
                <div className="font-semibold text-primary font-mono">{user?.email || "demo@businesstracker.com"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Currency Preferences Card */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title">
              <MdAttachMoney className="panel-icon text-accent" />
              <div>
                <h3>Financial Display & Currency</h3>
                <span className="text-muted text-sm">
                  Currency symbol formatted across all tables, reports, and charts
                </span>
              </div>
            </div>
          </div>
          <div className="panel-card-body">
            <div className="form-group mb-3" style={{ maxWidth: "340px" }}>
              <label className="form-label">Preferred Currency Symbol</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="form-control"
              >
                <option value="$">$ — US Dollar (USD)</option>
                <option value="€">€ — Euro (EUR)</option>
                <option value="DH">DH — Moroccan Dirham (MAD)</option>
                <option value="£">£ — British Pound (GBP)</option>
                <option value="CAD$">CAD$ — Canadian Dollar (CAD)</option>
                <option value="CHF">CHF — Swiss Franc (CHF)</option>
              </select>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveCurrency}
              disabled={savingCurrency}
            >
              <MdCheck size={16} /> {savingCurrency ? "Saving..." : "Save Currency Preference"}
            </button>
          </div>
        </div>

        {/* Security Settings Card */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title">
              <MdSecurity className="panel-icon text-accent" />
              <div>
                <h3>Account Security</h3>
                <span className="text-muted text-sm">
                  Update your authentication credentials and password
                </span>
              </div>
            </div>
          </div>
          <div className="panel-card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div className="font-semibold text-primary">Account Password</div>
              <p className="text-muted text-sm mb-0">
                It's recommended to use a unique, strong password with at least 8 characters.
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowPasswordModal(true)}
            >
              <MdLock size={16} /> Change Password
            </button>
          </div>
        </div>

        {/* Session Termination Card */}
        <div className="panel-card" style={{ border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <div className="panel-card-header">
            <div className="panel-card-title">
              <MdLogout className="panel-icon text-danger" />
              <div>
                <h3 className="text-danger">Log Out</h3>
                <span className="text-muted text-sm">
                  Terminate your active authentication session on this device
                </span>
              </div>
            </div>
          </div>
          <div className="panel-card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
            <p className="text-muted text-sm mb-0">
              You will be redirected to the sign-in screen. Unsaved modifications will be discarded.
            </p>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleLogout}
            >
              <MdLogout size={16} /> Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        show={showPasswordModal}
        onHide={() => setShowPasswordModal(false)}
        centered
        contentClassName="custom-modal-dark"
      >
        <Modal.Header closeButton>
          <Modal.Title>Update Account Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleChangePassword}>
            <div className="form-group mb-3">
              <label className="form-label">Current Password</label>
              <div className="input-wrapper has-icon-right">
                <input
                  type={showCurrent ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <span
                  className="input-icon input-icon-right clickable-icon"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <VscEyeClosed /> : <VscEye />}
                </span>
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">New Password</label>
              <div className="input-wrapper has-icon-right">
                <input
                  type={showNew ? "text" : "password"}
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <span
                  className="input-icon input-icon-right clickable-icon"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <VscEyeClosed /> : <VscEye />}
                </span>
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Confirm New Password</label>
              <div className="input-wrapper has-icon-right">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="form-control"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <span
                  className="input-icon input-icon-right clickable-icon"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <VscEyeClosed /> : <VscEye />}
                </span>
              </div>
            </div>

            <div className="modal-footer px-0 pb-0">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPasswordModal(false)}
                disabled={savingPassword}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingPassword}
              >
                {savingPassword ? <span className="auth-spinner" /> : "Update Password"}
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Settings;
