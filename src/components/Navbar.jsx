import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b py-3 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
        {/* โลโก้ */}
        <div className="text-2xl font-bold text-blue-600 mb-2 md:mb-0">
          <Link to="/">LokLok</Link>
        </div>

        {/* เมนูหลัก */}
        <div className="flex flex-wrap gap-4 items-center justify-center text-sm">
          <Link to="/" className="text-gray-700 hover:text-blue-600">หน้าแรก</Link>
          <Link to="/market" className="text-gray-700 hover:text-blue-600">สร้าง Layout</Link>
          <Link to="/my-markets" className="text-gray-700 hover:text-blue-600">Layout ของฉัน</Link>
          <Link to="/market-builder" className="text-gray-700 hover:text-blue-600">สร้างตลาดใหม่</Link>

          {/* ตรวจสอบสถานะผู้ใช้ */}
          {user ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 truncate max-w-[120px]">{user.email}</span>
              <button
                onClick={logout}
                className="text-red-500 hover:underline"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-blue-500 hover:underline">เข้าสู่ระบบ</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
