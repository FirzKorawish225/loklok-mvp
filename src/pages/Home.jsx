import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  const mockMarkets = [
    {
      id: 1,
      name: "ตลาดนัดจตุจักร",
      location: "กรุงเทพฯ",
      slots: 120,
    },
    {
      id: 2,
      name: "ตลาดกลางคืนเชียงใหม่",
      location: "เชียงใหม่",
      slots: 80,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">🛒 LokLok</h1>
        <p className="text-gray-600 mb-6">
          แพลตฟอร์มจองล็อกขายของทั่วไทย สำหรับเจ้าของตลาดและแม่ค้า
        </p>

        <div className="space-x-4 mb-8">
          <Link
            to="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            to="/register"
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            สมัครสมาชิก
          </Link>
        </div>

        <h2 className="text-xl font-semibold text-left mb-4">📍 ตลาดแนะนำ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockMarkets.map((market) => (
            <div
              key={market.id}
              className="bg-white p-4 shadow rounded hover:shadow-lg"
            >
              <h3 className="text-lg font-semibold">{market.name}</h3>
              <p className="text-gray-500">{market.location}</p>
              <p className="text-sm text-gray-400">
                จำนวนล็อกทั้งหมด: {market.slots}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
