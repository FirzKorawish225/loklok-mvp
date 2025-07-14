import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

const MarketBookingOverview = () => {
  const { id } = useParams(); // marketId
  const [market, setMarket] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchMarketAndBookings = async () => {
      try {
        const marketRef = doc(db, "markets", id);
        const marketSnap = await getDoc(marketRef);
        if (marketSnap.exists()) {
          setMarket(marketSnap.data());
        }

        const q = query(collection(db, "bookings"), where("marketId", "==", id));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBookings(data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchMarketAndBookings();
  }, [id]);

  const getBookingsForSlot = (slotId) =>
    bookings.filter(b => b.slotId === slotId);

  if (!market) return <p className="p-6">กำลังโหลดข้อมูลตลาด...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">ภาพรวมการจอง: {market.name}</h1>
      <p className="text-gray-600 mb-6">{market.description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {market.layout.map((slot) => {
          const slotBookings = getBookingsForSlot(slot.i);
          return (
            <div
              key={slot.i}
              className="border rounded shadow p-4 bg-white"
            >
              <h3 className="font-bold text-lg mb-2">{slot.i}</h3>
              {slotBookings.length === 0 ? (
                <p className="text-sm text-gray-500">ยังไม่มีผู้จอง</p>
              ) : (
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-3">
                  {slotBookings.map((booking) => (
                    <li key={booking.id}>
                      <div className="font-semibold">{booking.name || "ไม่ระบุชื่อ"}</div>
                      <div className="text-sm text-gray-600">
                        📞 {booking.phone || "ไม่ระบุเบอร์"}
                      </div>
                    </li>
                  ))}
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
