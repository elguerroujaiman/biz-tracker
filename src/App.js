import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Toaster } from "react-hot-toast";

import Login from "./components/Login";
import SignUp from "./components/Signup";

import SettingsPage from "./components/settings/SettingsPage";
import Home from "./components/Home";
import Inventory from "./components/Inventory/Inventory";

// sidebar
import Navbar from "./components/Navbar";

import PrivateRoute from "./components/PrivateRoute";

// Sales Components
import SalesPage from "./components/sales/SalesPage";
import SaleForm from "./components/sales/SaleForm";
import SaleDetail from "./components/sales/SaleDetail";
import SalesStats from "./components/sales/SalesStats";

// Purchases Components
import PurchasesPage from "./components/purchases/PurchasesPage";
import PurchaseForm from "./components/purchases/PurchaseForm";
import PurchaseDetail from "./components/purchases/PurchaseDetail";
import PurchaseStats from "./components/purchases/PurchaseStats";

// Sales Components
import DashboardPage from "./components/Dashboard/DashboardPage";

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <div id="main-content">{children}</div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes inside layout */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <AppLayout>
                <Home />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <PrivateRoute>
              <AppLayout>
                <Inventory />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <PrivateRoute>
              <AppLayout>
                <SalesPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/sales/new"
          element={
            <PrivateRoute>
              <AppLayout>
                <SaleForm />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/sales/:sale_id"
          element={
            <PrivateRoute>
              <AppLayout>
                <SaleDetail />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/sales/stats"
          element={
            <PrivateRoute>
              <AppLayout>
                <SalesStats />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/purchases"
          element={
            <PrivateRoute>
              <AppLayout>
                <PurchasesPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/purchases/new"
          element={
            <PrivateRoute>
              <AppLayout>
                <PurchaseForm />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/purchases/:purchase_id"
          element={
            <PrivateRoute>
              <AppLayout>
                <PurchaseDetail />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/purchases/stats"
          element={
            <PrivateRoute>
              <AppLayout>
                <PurchaseStats />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;