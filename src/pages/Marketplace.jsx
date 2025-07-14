import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const Marketplace = () => {
  const [markets, setMarkets] = useState([]);

  useEffect(() => {
    const fetchMarkets = async () => {
      const snapshot = await getDocs(collection(db, "markets"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMarkets(data);
    };

    fetchMarkets();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">📍 ตลาดทั้งหมด</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {markets.map((market) => (
          <div
            key={market.id}
            className="border rounded-lg shadow p-4 bg-white hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold">{market.name}</h2>
            <p className="text-gray-600">{market.location || "ไม่ระบุจังหวัด"}</p>
            <p className="text-sm text-gray-500">จำนวนบูธทั้งหมด: {market.slots?.length || 0}</p>
            <Link
              to={`/market-view/${market.id}`}
              className="mt-2 inline-block text-blue-600 hover:underline text-sm"
            >
              👉 ดูรายละเอียดตลาด
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;
