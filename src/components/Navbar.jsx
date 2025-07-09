import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <div className="text-xl font-bold text-blue-600">
        <Link to="/">LokLok</Link>
      </div>

      <div className="flex gap-4 items-center">
        <Link to="/" className="hover:underline">
          หน้าแรก
        </Link>
        <Link to="/market" className="hover:underline">
          สร้าง Layout
        </Link>
        <Link to="/my-markets" className="hover:underline">
          Layout ของฉัน
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-sm">{user.email}</span>
            <button
              onClick={logout}
              className="text-red-500 hover:underline text-sm"
            >
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <Link to="/login" className="text-blue-500 hover:underline">
            เข้าสู่ระบบ
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

