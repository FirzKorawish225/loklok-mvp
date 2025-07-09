import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// 🆕 เพิ่มบริการที่แยกออกมา
import {
  getBookingsByMarket,
  isSlotBooked,
  createBooking,
} from "../services/BookingService";

const ResponsiveGridLayout = WidthProvider(Responsive);

const MarketPublicView = () => {
  const { user } = useAuth();
  const { marketId } = useParams();
  const [market, setMarket] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "markets", marketId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMarket(docSnap.data());
        }

        const bookingData = await getBookingsByMarket(marketId);
        setBookings(bookingData);
      } catch (err) {
        console.error("โหลดข้อมูลล้มเหลว", err);
      }
    };

    fetchData();
  }, [marketId]);

  const handleBooking = async (slotId) => {
    if (!user) {
      alert("กรุณาเข้าสู่ระบบเพื่อทำการจอง");
      return;
    }

    const alreadyBooked = isSlotBooked(bookings, slotId);
    if (alreadyBooked) {
      alert("ล็อกนี้ถูกจองแล้ว");
      return;
    }

    try {
      await createBooking({ marketId, slotId, userId: user.uid });
      alert("จองสำเร็จ!");
      window.location.reload();
    } catch (error) {
      console.error("Booking error:", error);
      alert("จองไม่สำเร็จ");
    }
  };

  if (!market) return <p className="p-6">กำลังโหลด...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">ตลาด: {market.name}</h1>

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: market.layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={50}
        isDraggable={false}
        isResizable={false}
      >
        {market.layout.map((slot) => {
          const isBooked = isSlotBooked(bookings, slot.i);
          const isMine = bookings.find((b) => b.slotId === slot.i && b.userId === user?.uid);

          return (
            <div
              key={slot.i}
              style={{
                backgroundColor: isBooked
                  ? isMine ? "#b2f5ea" : "#e2e8f0"
                  : "#c6f6d5",
              }}
              className="border rounded shadow flex flex-col items-center justify-center text-sm text-gray-800"
            >
              <div className="font-bold">{slot.i}</div>
              {!isBooked ? (
                user ? (
                  <button
                    className="mt-1 text-xs text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                    onClick={() => handleBooking(slot.i)}
                  >
                    จอง
                  </button>
                ) : (
                  <span className="text-xs mt-1 text-blue-700">เข้าสู่ระบบเพื่อจอง</span>
                )
              ) : isMine ? (
                <span className="text-green-700 text-xs mt-1">คุณจองแล้ว</span>
              ) : (
                <span className="text-gray-500 text-xs mt-1">จองแล้ว</span>
              )}
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
};

export default MarketPublicView;
