import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      const q = query(collection(db, "bookings"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);

      const results = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const marketRef = doc(db, "markets", data.marketId);
          const marketSnap = await getDoc(marketRef);
          const marketName = marketSnap.exists() ? marketSnap.data().name : "ตลาดไม่พบ";

          return {
            id: docSnap.id,
            marketName,
            slotId: data.slotId,
            type: data.type || "ไม่ระบุ",
            createdAt: data.createdAt?.toDate().toLocaleString("th-TH"),
            status: data.status || "จองแล้ว",
          };
        })
      );

      setBookings(results);
      setLoading(false);
    };

    fetchBookings();
  }, [user]);

  if (!user) return <p className="p-6">กรุณาเข้าสู่ระบบเพื่อดูการจองของคุณ</p>;

  if (loading) return <p className="p-6">กำลังโหลดข้อมูล...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">รายการจองของฉัน</h1>
      {bookings.length === 0 ? (
        <p>ยังไม่มีรายการจอง</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ตลาด</th>
              <th className="p-2 border">ล็อก</th>
              <th className="p-2 border">ประเภท</th>
              <th className="p-2 border">วันที่จอง</th>
              <th className="p-2 border">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="p-2 border">{b.marketName}</td>
                <td className="p-2 border">{b.slotId}</td>
                <td className="p-2 border">{b.type}</td>
                <td className="p-2 border">{b.createdAt}</td>
                <td className="p-2 border">{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyBookings;
