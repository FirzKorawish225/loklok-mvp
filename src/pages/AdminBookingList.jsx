import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

const AdminBookingList = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [marketMap, setMarketMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchBookingsForAdmin = async () => {
      try {
        // ✅ ดึงตลาดที่เจ้าของเป็น user นี้
        const marketQuery = query(collection(db, "markets"), where("ownerUid", "==", user.uid));
        const marketSnapshot = await getDocs(marketQuery);

        const marketIds = [];
        const marketNames = {};

        marketSnapshot.forEach((docSnap) => {
          marketIds.push(docSnap.id);
          marketNames[docSnap.id] = docSnap.data().name;
        });

        setMarketMap(marketNames);

        if (marketIds.length === 0) {
          setBookings([]);
          setLoading(false);
          return;
        }

        // ✅ Firestore จำกัด in ได้แค่ 10 ค่า
        const chunks = [];
        for (let i = 0; i < marketIds.length; i += 10) {
          chunks.push(marketIds.slice(i, i + 10));
        }

        const allBookings = [];

        for (const chunk of chunks) {
          const bookingsQuery = query(collection(db, "bookings"), where("marketId", "in", chunk));
          const snapshot = await getDocs(bookingsQuery);
          snapshot.forEach((docSnap) => {
            allBookings.push({ id: docSnap.id, ...docSnap.data() });
          });
        }

        setBookings(allBookings);
      } catch (err) {
        console.error("โหลด bookings ล้มเหลว", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingsForAdmin();
  }, [user]);

  const updateStatus = async (bookingId, newStatus) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: newStatus,
      });
      alert(`อัปเดตสถานะเป็น "${newStatus}" แล้ว`);
      // รีโหลดอีกครั้ง
      setLoading(true);
      setBookings([]);
    } catch (err) {
      console.error("เปลี่ยนสถานะล้มเหลว", err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  if (loading) return <p className="p-6">กำลังโหลดข้อมูล...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">รายการจองจากตลาดของคุณ</h2>

      {bookings.length === 0 ? (
        <p>ยังไม่มีรายการจอง</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">ตลาด</th>
                <th className="border px-4 py-2">ล็อก</th>
                <th className="border px-4 py-2">ชื่อ</th>
                <th className="border px-4 py-2">เบอร์โทร</th>
                <th className="border px-4 py-2">ประเภท</th>
                <th className="border px-4 py-2">วันที่</th>
                <th className="border px-4 py-2">สถานะ</th>
                <th className="border px-4 py-2">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="text-center">
                  <td className="border px-4 py-2">{marketMap[b.marketId] || b.marketId}</td>
                  <td className="border px-4 py-2">{b.slotId}</td>
                  <td className="border px-4 py-2">{b.name || "-"}</td>
                  <td className="border px-4 py-2">{b.phone || "-"}</td>
                  <td className="border px-4 py-2">{b.bookingType}</td>
                  <td className="border px-4 py-2">
                    {b.bookingType === "รายวัน"
                      ? `${b.fromDate?.toDate?.().toLocaleDateString()} - ${b.toDate?.toDate?.().toLocaleDateString()}`
                      : `${b.months || "?"} เดือน`}
                  </td>
                  <td className="border px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-white text-sm ${
                        b.status === "pending"
                          ? "bg-yellow-500"
                          : b.status === "approved"
                          ? "bg-blue-500"
                          : b.status === "paid"
                          ? "bg-green-500"
                          : b.status === "rejected"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="border px-4 py-2">
                    {b.status === "pending" && (
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => updateStatus(b.id, "approved")}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => updateStatus(b.id, "rejected")}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBookingList;
