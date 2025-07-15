import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth(); // ✅ ตรวจสอบ loading flag

  if (loading) {
    return <div className="p-6">กำลังโหลด...</div>;
  }

  return user ? children : <Navigate to="/" />;
};

export default ProtectedRoute;