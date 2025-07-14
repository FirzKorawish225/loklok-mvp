import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "../components/Navbar";

const Home = () => {
  const [markets, setMarkets] = useState([]);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const snapshot = await getDocs(collection(db, "markets"));
        const marketsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMarkets(marketsData);
      } catch (err) {
        console.error("Error fetching markets:", err);
      }
    };

    fetchMarkets();
  }, []);

  return (
    <>
     

      <div className="min-h-screen bg-gray-50 py-10 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-blue-700 mb-2">🛒 LokLok</h1>
          <p className="text-gray-600 mb-8">
            แพลตฟอร์มจองล็อกขายของทั่วไทย สำหรับเจ้าของตลาดและแม่ค้า
          </p>

          <div className="mb-8 space-x-4">
            <Link to="/login" className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700">เข้าสู่ระบบ</Link>{" "}
            <Link to="/register" className="bg-white border px-5 py-2 rounded-md hover:bg-gray-100">สมัครสมาชิก</Link>
          </div>

          <h2 className="text-2xl font-bold text-left mb-4">📍 ตลาดแนะนำ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            {markets.length === 0 ? (
              <p className="text-gray-400">กำลังโหลดตลาด...</p>
            ) : (
              markets.map((market) => (
                <div key={market.id} className="bg-white p-5 rounded-lg shadow hover:shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800">{market.name}</h3>
                  <p className="text-gray-500">{market.location || "ไม่ระบุจังหวัด"}</p>
                  <p className="text-gray-400 text-sm mb-3">จำนวนล็อกทั้งหมด: {market.layout?.length || 0}</p>
                  <Link to={`/market-view/${market.id}`} className="text-blue-600 hover:underline text-sm">
                    👉 ดูหน้าสาธารณะ
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
