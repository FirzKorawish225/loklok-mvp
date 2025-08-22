// src/pages/Marketplace.jsx
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

const Marketplace = () => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "markets"), orderBy("name", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMarkets(rows);
        setLoading(false);
      },
      (err) => {
        console.error("load markets error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  if (loading) return <div className="p-6">กำลังโหลดตลาด...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📍 ตลาดทั้งหมด</h1>

      {markets.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีตลาด</p>
      ) : (
        <ul className="space-y-6">
          {markets.map((m) => {
            const boothCount = Array.isArray(m.layout) ? m.layout.length : 0; // ✅ นับจาก layout
            return (
              <li key={m.id} className="border rounded p-4 bg-white shadow">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-lg font-semibold">{m.name || "-"}</div>
                    <div className="text-sm text-gray-600">
                      {m.location || m.description || ""}
                    </div>
                    <div className="text-sm mt-1">
                      จำนวนบูธทั้งหมด: <b>{boothCount}</b>
                    </div>
                  </div>
                  <Link
                    to={`/market-view/${m.id}`}
                    className="text-blue-600 underline whitespace-nowrap"
                  >
                    👉 ดูรายละเอียดตลาด
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Marketplace;
