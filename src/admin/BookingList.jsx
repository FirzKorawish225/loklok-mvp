import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

const BookingList = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingsForAdmin = async () => {
      if (!user) return;

      try {
        // 🔎 ดึงตลาดที่ user เป็นเจ้าของ
        const marketQuery = query(collection(db, "markets"), where("ownerId", "==", user.uid));
        const marketSnapshot = await getDocs(marketQuery);
        const marketIds = marketSnapshot.docs.map(doc => doc.id);

        if (marketIds.length === 0) {
          setBookings([]);
          setLoading(false);
          return;
        }

        // 🔎 ดึง bookings ของตลาดที่ user เป็นเจ้าของ
        const bookingsQuery = query(
          collection(db, "bookings"),
          where("marketId", "in", marketIds.slice(0, 10)) // Firestore จำกัด in ที่ 10 ค่า
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const results = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setBookings(results);
        setLoading(false);
      } catch (err) {
        console.error("โหลด bookings ล้มเหลว", err);
        setLoading(false);
      }
    };

    fetchBookingsForAdmin();
  }, [user]);

  if (loading) return <p className="p-6">กำลังโหลดข้อมูล...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">รายการจองจากตลาดของคุณ</h2>
      {bookings.length === 0 ? (
        <p>ยังไม่มีรายการจอง</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">ตลาด</th>
              <th className="border px-4 py-2">ล็อก</th>
              <th className="border px-4 py-2">ชื่อ</th>
              <th className="border px-4 py-2">เบอร์โทร</th>
              <th className="border px-4 py-2">วันที่</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="border px-4 py-2">{b.marketId}</td>
                <td className="border px-4 py-2">{b.slotId}</td>
                <td className="border px-4 py-2">{b.name || "-"}</td>
                <td className="border px-4 py-2">{b.phone || "-"}</td>
                <td className="border px-4 py-2">{b.createdAt?.toDate().toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BookingList;
