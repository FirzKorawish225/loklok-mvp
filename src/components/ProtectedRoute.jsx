import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { userData, loading } = useAuth();

  if (loading) return <p className="p-6">กำลังโหลด...</p>;

  if (!userData || userData.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
