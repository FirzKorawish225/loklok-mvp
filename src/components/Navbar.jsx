// src/components/Navbar.jsx
import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import NotificationsBell from "../components/NotificationsBell";

const Navbar = () => {
  const { user, logout, role } = useAuth();
  const isOwner = role === "admin" || role === "owner";
  const isSeller = role === "seller";

  const itemCls =
    "text-gray-700 hover:text-blue-600 transition-colors";
  const activeCls =
    "text-blue-600 font-semibold";

  return (
    <nav className="bg-white shadow-sm border-b py-3 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        {/* โลโก้ */}
        <div className="text-2xl font-bold text-blue-600">
          <Link to="/">LokLok</Link>
        </div>

        {/* เมนูกลาง/ซ้าย */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? activeCls : itemCls)}
          >
            หน้าแรก
          </NavLink>

          <NavLink
            to="/marketplace"
            className={({ isActive }) => (isActive ? activeCls : itemCls)}
          >
            ตลาดทั้งหมด
          </NavLink>

          {/* เมนูของผู้ใช้ทั่วไป/ล็อกอินแล้ว */}
          {!user ? (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? activeCls : "text-blue-500 hover:underline")}
              >
                เข้าสู่ระบบ
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => (isActive ? activeCls : "text-blue-500 hover:underline")}
              >
                สมัครสมาชิก
              </NavLink>
            </>
          ) : (
            <>
              {/* Common */}
              <NavLink
                to="/profile"
                className={({ isActive }) => (isActive ? activeCls : itemCls)}
              >
                โปรไฟล์
              </NavLink>

              {/* ผู้ขาย */}
              {isSeller && (
                <NavLink
                  to="/my-bookings"
                  className={({ isActive }) => (isActive ? activeCls : itemCls)}
                >
                  รายการจองของฉัน
                </NavLink>
              )}

              {/* เจ้าของตลาด / แอดมิน */}
              {isOwner && (
                <>
                  <NavLink
                    to="/market-builder"
                    className={({ isActive }) => (isActive ? activeCls : itemCls)}
                  >
                    สร้างตลาดใหม่
                  </NavLink>
                  <NavLink
                    to="/my-markets"
                    className={({ isActive }) => (isActive ? activeCls : itemCls)}
                  >
                    ตลาดของฉันทั้งหมด
                  </NavLink>
                  <NavLink
                    to="/owner/dashboard"
                    className={({ isActive }) => (isActive ? activeCls : itemCls)}
                  >
                    แดชบอร์ดเจ้าของตลาด
                  </NavLink>
                  <NavLink
                    to="/admin/bookings"
                    className={({ isActive }) => (isActive ? activeCls : itemCls)}
                  >
                    รายการจอง (แอดมิน)
                  </NavLink>
                </>
              )}
            </>
          )}
        </div>

        {/* ผู้ใช้งานขวา */}
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <NotificationsBell />
            <span className="text-gray-500 truncate max-w-[160px]" title={user.email}>
              {user.email}
            </span>
            <button
              onClick={logout}
              className="text-red-500 hover:underline"
            >
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
