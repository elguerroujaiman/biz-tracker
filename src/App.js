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

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <Home />
              </>
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <Inventory />
              </>
            </PrivateRoute>
          }
        />

        {/* Sales Routes */}
        <Route
          path="/sales"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <SalesPage />
              </>
            </PrivateRoute>
          }
        />
        <Route
          path="/sales/new"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <SaleForm />
              </>
            </PrivateRoute>
          }
        />
        <Route
          path="/sales/:sale_id"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <SaleDetail />
              </>
            </PrivateRoute>
          }
        />
        <Route
          path="/sales/stats"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <SalesStats />
              </>
            </PrivateRoute>
          }
        />

        <Route
          path="/purchases"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <PurchasesPage />
              </>
            </PrivateRoute>
          }
        />
        <Route
          path="/purchases/new"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <PurchaseForm />
              </>
            </PrivateRoute>
          }
        />
        <Route
          path="/purchases/:purchase_id"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <PurchaseDetail />
              </>
            </PrivateRoute>
          }
        />
        <Route
          path="/purchases/stats"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <PurchaseStats />
              </>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <SettingsPage />
              </>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;