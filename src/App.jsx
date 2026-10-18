import React, { lazy, Suspense } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login     from "./components/Login";
import PrivateRoute from "./components/PrivateRoute";
import { SettingsProvider } from "./contexts/SettingsContext";

const SignUp = lazy(() => import("./components/Signup"));
const Navbar = lazy(() => import("./components/Navbar"));

const Home = lazy(() => import("./components/Home"));
const Inventory = lazy(() => import("./components/Inventory/Inventory"));
const SettingsPage = lazy(() => import("./components/settings/SettingsPage"));
const DashboardPage = lazy(() => import("./components/Dashboard/DashboardPage"));

// Sales — NOTE: /sales/new and /sales/stats MUST come before /sales/:sale_id
const SalesPage = lazy(() => import("./components/sales/SalesPage"));
const SaleForm = lazy(() => import("./components/sales/SaleForm"));
const SaleDetail = lazy(() => import("./components/sales/SaleDetail"));
const SalesStats = lazy(() => import("./components/sales/SalesStats"));

// Purchases — same ordering rule
const PurchasesPage = lazy(() => import("./components/purchases/PurchasesPage"));
const PurchaseForm = lazy(() => import("./components/purchases/PurchaseForm"));
const PurchaseDetail = lazy(() => import("./components/purchases/PurchaseDetail"));
const PurchaseStats = lazy(() => import("./components/purchases/PurchaseStats"));

/** Wraps protected pages in the sidebar layout */
function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

/** Combines PrivateRoute + AppLayout for convenience */
function ProtectedPage({ children }) {
  return (
    <PrivateRoute>
      <AppLayout>{children}</AppLayout>
    </PrivateRoute>
  );
}

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.875rem",
            },
            success: { iconTheme: { primary: "var(--success)", secondary: "transparent" } },
            error:   { iconTheme: { primary: "var(--danger)",  secondary: "transparent" } },
          }}
        />
        <Suspense fallback={<div className="route-loading" role="status">Loading page…</div>}>
          <Routes>
            {/* Public */}
            <Route path="/"       element={<Login />} />
            <Route path="/signin" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected — specific paths BEFORE parameterised ones */}
            <Route path="/home"      element={<ProtectedPage><Home /></ProtectedPage>} />
            <Route path="/inventory" element={<ProtectedPage><Inventory /></ProtectedPage>} />
            <Route path="/dashboard" element={<ProtectedPage><DashboardPage /></ProtectedPage>} />
            <Route path="/settings"  element={<ProtectedPage><SettingsPage /></ProtectedPage>} />

            {/* Sales */}
            <Route path="/sales"       element={<ProtectedPage><SalesPage /></ProtectedPage>} />
            <Route path="/sales/new"   element={<ProtectedPage><SaleForm /></ProtectedPage>} />
            <Route path="/sales/stats" element={<ProtectedPage><SalesStats /></ProtectedPage>} />
            <Route path="/sales/:sale_id" element={<ProtectedPage><SaleDetail /></ProtectedPage>} />

            {/* Purchases */}
            <Route path="/purchases"       element={<ProtectedPage><PurchasesPage /></ProtectedPage>} />
            <Route path="/purchases/new"   element={<ProtectedPage><PurchaseForm /></ProtectedPage>} />
            <Route path="/purchases/stats" element={<ProtectedPage><PurchaseStats /></ProtectedPage>} />
            <Route path="/purchases/:purchase_id" element={<ProtectedPage><PurchaseDetail /></ProtectedPage>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;
