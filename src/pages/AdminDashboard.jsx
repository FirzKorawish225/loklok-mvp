// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [markets, setMarkets] = useState([]);

  useEffect(() => {
    const fetchMarkets = async () => {
      if (!user) return;
      const q = query(
        collection(db, "markets"),
        where("ownerUid", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMarkets(data);
    };

    fetchMarkets();
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">แดชบอร์ดเจ้าของตลาด</h1>

      {markets.length === 0 ? (
        <p className="text-gray-600">ยังไม่มีตลาดที่คุณเป็นเจ้าของ</p>
      ) : (
        <div className="grid gap-4">
          {markets.map((market) => (
            <div key={market.id} className="p-4 border rounded shadow bg-white">
              <h2 className="text-lg font-semibold">{market.name}</h2>
              <p className="text-sm text-gray-600">{market.description}</p>
              <p className="text-xs text-gray-400 mt-1">ID: {market.id}</p>
              <div className="mt-2 space-x-4">
                <Link
                  to={`/market/${market.id}`}
                  className="text-blue-600 text-sm hover:underline"
                >
                  ดูตลาด (หน้า Public)
                </Link>
                <Link
                  to={`/market-editor/${market.id}`}
                  className="text-green-600 text-sm hover:underline"
                >
                  แก้ไข Layout
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
