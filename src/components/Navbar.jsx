import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout, role } = useAuth();

  const isAdmin = role === "admin" || role === "owner";

  return (
    <nav className="bg-white shadow-sm border-b py-3 px-6">
  <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
    
    {/* โลโก้ */}
    <div className="text-2xl font-bold text-blue-600 mb-2 md:mb-0">
      <Link to="/">LokLok</Link>
    </div>

    {/* เมนูซ้าย */}
    <div className="flex flex-wrap gap-4 items-center text-sm">
      <Link to="/" className="text-gray-700 hover:text-blue-600">หน้าแรก</Link>{" "}

      {!user ? (
        <>
          <Link to="/login" className="text-blue-500 hover:underline">เข้าสู่ระบบ</Link>{" "}
          <Link to="/register" className="text-blue-500 hover:underline">สมัครสมาชิก</Link>
        </>
      ) : (
        <>
          <Link to="/market" className="text-gray-700 hover:text-blue-600">สร้าง Layout</Link>{" "}
          <Link to="/my-markets" className="text-gray-700 hover:text-blue-600">Layout ของฉัน</Link>{" "}
          <Link to="/market-builder" className="text-gray-700 hover:text-blue-600">สร้างตลาดใหม่</Link>{" "}
          <Link to="/marketplace" className="text-gray-700 hover:text-blue-600">ตลาดทั้งหมด</Link>{" "}
          <Link to="/profile" className="text-gray-700 hover:text-blue-600">โปรไฟล์</Link>{" "}

          {(role === "admin" || role === "owner") && (
            <>
              <Link to="/seller/bookings" className="text-blue-600">รายการจอง</Link>{" "}
              <Link to="/admin-dashboard" className="text-blue-600">แดชบอร์ดเจ้าของตลาด</Link>{" "}
            </>
          )}
        </>
      )}
    </div>

    {/* ผู้ใช้งานขวา */}
    {user && (
      <div className="flex items-center gap-2 text-sm mt-3 md:mt-0">
        <span className="text-gray-500 truncate max-w-[120px]">{user.email}</span>
        <button onClick={logout} className="text-red-500 hover:underline">
          ออกจากระบบ
        </button>
      </div>
    )}
  </div>
</nav>
  );
};

export default Navbar;
