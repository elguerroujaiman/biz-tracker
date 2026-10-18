import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  return token ? children : <Navigate to="/signin" replace />;
};

export default PrivateRoute;
