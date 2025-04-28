import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import SignUp from "./components/Signup";
import Home from "./components/Home";
import Inventory from "./components/Inventory/Inventory";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";

// Sales Components
import SalesPage from "./components/sales/SalesPage";
import SaleForm from "./components/sales/SaleForm";
import SaleDetail from "./components/sales/SaleDetail";
import SalesStats from "./components/sales/SalesStats";

function App() {
  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;