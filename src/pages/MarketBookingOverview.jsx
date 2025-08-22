// src/pages/MarketBookingOverview.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

const activeStatuses = ["pending", "approved", "paid"]; // ซ่อน rejected/cancelled

const MarketBookingOverview = () => {
  const { id } = useParams(); // marketId
  const [market, setMarket] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        // โหลดข้อมูลตลาด
        const marketRef = doc(db, "markets", id);
        const marketSnap = await getDoc(marketRef);
        if (marketSnap.exists()) setMarket(marketSnap.data());

        // subscribe bookings แบบ realtime (เฉพาะ market นี้)
        const q = query(collection(db, "bookings"), where("marketId", "==", id));
        unsub = onSnapshot(q, (snap) => {
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          // กรองสถานะเฉพาะที่ยัง active
          setBookings(rows.filter((b) => activeStatuses.includes(b.status || "pending")));
        });
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    })();
    return () => unsub && unsub();
  }, [id]);

  const getBookingsForSlot = (slotId) => bookings.filter((b) => b.slotId === slotId);

  const fmtDate = (v) => {
    try {
      const d = v?.toDate?.() ?? new Date(v);
      return isNaN(d) ? "-" : d.toLocaleDateString();
    } catch {
      return "-";
    }
  };

  const StatusBadge = ({ s }) => {
    const map = {
      pending: "bg-yellow-500",
      approved: "bg-blue-500",
      paid: "bg-green-600",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-white text-xs ${map[s] || "bg-gray-400"}`}>
        {s}
      </span>
    );
  };

  if (!market) return <p className="p-6">กำลังโหลดข้อมูลตลาด...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">ภาพรวมการจอง: {market.name}</h1>
      <p className="text-gray-600 mb-6">{market.description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(market.layout || []).map((slot) => {
          const slotBookings = getBookingsForSlot(slot.i);
          return (
            <div key={slot.i} className="border rounded shadow p-4 bg-white">
              <h3 className="font-bold text-lg mb-2">จุด: {slot.i}</h3>

              {slotBookings.length === 0 ? (
                <p className="text-sm text-gray-500">ยังไม่มีผู้จอง</p>
              ) : (
                <ul className="text-sm text-gray-700 space-y-3">
                  {slotBookings.map((b) => {
                    const period =
                      b.bookingType === "รายวัน"
                        ? `${fmtDate(b.fromDate)} - ${fmtDate(b.toDate)}`
                        : b.startMonth
                        ? `${fmtDate(b.startMonth)} • ${b.months || 1} เดือน`
                        : `${b.months || "-"} เดือน`;
                    return (
                      <li key={b.id} className="border rounded p-2">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{b.name || "ไม่ระบุชื่อ"}</div>
                          <StatusBadge s={b.status || "pending"} />
                        </div>
                        <div className="text-gray-600">📞 {b.phone || "ไม่ระบุเบอร์"}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          ประเภท: {b.bookingType || "-"} • ช่วง: {period}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketBookingOverview;
