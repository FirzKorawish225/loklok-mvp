// src/pages/OwnerDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useAuth } from "../contexts/AuthContext";
import { notifyStatusChange } from "../services/BookingService";


const ResponsiveGridLayout = WidthProvider(Responsive);

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [markets, setMarkets] = useState([]);
  const [bookingsMap, setBookingsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAll().catch(console.error);
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);

    // 1) ตลาดของ owner
    const marketQuery = query(
      collection(db, "markets"),
      where("ownerUid", "==", user.uid)
    );
    const marketSnap = await getDocs(marketQuery);
    const marketList = marketSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setMarkets(marketList);

    // 2) ดึง bookings แบบ batch (in <= 10)
    const ids = marketList.map((m) => m.id);
    const chunk = (arr, size) =>
      Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
      );

    const groups = {};
    if (ids.length > 0) {
      const chunks = chunk(ids, 10);
      for (const c of chunks) {
        const bq = query(
          collection(db, "bookings"),
          where("marketId", "in", c)
        );
        const bsnap = await getDocs(bq);
        bsnap.docs.forEach((b) => {
          const data = { id: b.id, ...b.data() };
          if (!groups[data.marketId]) groups[data.marketId] = [];
          groups[data.marketId].push(data);
        });
      }
    }
    setBookingsMap(groups);

    setLoading(false);
  };

  const fmtDate = (v) => {
    try {
      if (!v) return "-";
      const d = v?.toDate?.() ?? new Date(v);
      return isNaN(d) ? "-" : d.toLocaleDateString();
    } catch {
      return "-";
    }
  };

  // เปลี่ยน "สถานะการจอง" และแจ้งเตือนผู้จอง
  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const bRef = doc(db, "bookings", bookingId);
      const bSnap = await getDoc(bRef);
      if (!bSnap.exists()) {
        alert("ไม่พบรายการจอง");
        return;
      }
      const b = bSnap.data();

      await updateDoc(bRef, { status: newStatus });
      
      // โหลดชื่อ market
      const mRef = doc(db, "markets", b.marketId);
      const mSnap = await getDoc(mRef);
      const marketName = mSnap.exists() ? mSnap.data().name : b.marketId;

      // แจ้งเตือนผู้จอง
      await notifyStatusChange({
        toUserId: b.userId,
        marketName,
        slotId: b.slotId,
        status: newStatus,
        bookingId,
      });

      // กรณีอนุมัติแล้ว ต้องการให้สถานะการชำระเงินเริ่มเป็น "waiting"
      if (newStatus === "approved" && !b.paymentStatus) {
        await updateDoc(bRef, { paymentStatus: "waiting" });
      }

      alert(`อัปเดตสถานะการจองเป็น "${newStatus}" แล้ว`);
      fetchAll();
    } catch (error) {
      console.error("❌ Error updating status:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  // เปลี่ยน "สถานะการชำระเงิน" (อนุมัติสลิป/ปฏิเสธ)
const updatePaymentStatus = async (bookingId, status) => {
  try {
    // 1) อัปเดต paymentStatus + (option) sync status หลัก
    await updateDoc(doc(db, "bookings", bookingId), {
      paymentStatus: status,
      ...(status === "rejected" ? { status: "rejected" } : {}),
      ...(status === "paid" ? { status: "approved" } : {}),
    });

    // 2) ดึงข้อมูล booking + market แล้วแจ้งไปหาผู้จอง
    const bSnap = await getDoc(doc(db, "bookings", bookingId));
    if (!bSnap.exists()) {
      alert("ไม่พบรายการจอง");
      return;
    }
    const b = bSnap.data();

    const mSnap = await getDoc(doc(db, "markets", b.marketId));
    const market = mSnap.exists() ? mSnap.data() : {};

    await notifyStatusChange({
      toUserId: b.userId,
      marketName: market.name || "-",
      slotId: b.slotId,
      status,         // "paid" | "rejected"
      bookingId,
    });

    alert(`อัปเดตสถานะชำระเงินเป็น "${status}" แล้ว`);
    fetchAll();
  } catch (error) {
    console.error("❌ Error updating payment status:", error);
    alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
  }
};



  const StatusBadge = ({ s }) => {
    const map = {
      pending: "bg-yellow-500",
      approved: "bg-blue-500",
      paid: "bg-green-600",
      rejected: "bg-red-500",
      cancelled: "bg-gray-500",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-white text-xs ${map[s] || "bg-gray-400"}`}>
        {s || "-"}
      </span>
    );
  };

  if (loading) return <div className="p-6">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">แดชบอร์ดเจ้าของตลาด</h2>

      {markets.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีตลาดที่สร้างไว้</p>
      ) : (
        markets.map((market, idx) => {
          const bookingList = (bookingsMap[market.id] || []).sort(
            (a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0)
          );
          return (
            <div key={market.id} className="mb-10 border rounded bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{market.name}</h3>
                <div className="text-sm text-gray-500">
                  {market.location || market.description || ""}
                </div>
              </div>

              <ResponsiveGridLayout
                className="layout mt-4"
                layouts={{ lg: market.layout }}
                breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                cols={{ lg: 12, md: 10, sm: 6 }}
                rowHeight={50}
                isDraggable={false}
                isResizable={false}
                compactType={null}
              >
                {market.layout?.map((slot, index) => (
                  <div
                    key={slot.i}
                    className="border rounded flex items-center justify-center text-sm font-semibold text-gray-700"
                    style={{ backgroundColor: `hsl(${(index * 45) % 360}, 70%, 85%)` }}
                  >
                    {slot.i}
                  </div>
                ))}
              </ResponsiveGridLayout>

              <h4 className="text-md font-semibold mt-6 mb-2">📄 รายการจอง</h4>
              {bookingList.length > 0 ? (
                <table className="table-auto text-sm border w-full mt-2">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1">ล็อก</th>
                      <th className="border px-2 py-1">ประเภท</th>
                      <th className="border px-2 py-1">ช่วงเวลา</th>
                      <th className="border px-2 py-1">สถานะ</th>
                      <th className="border px-2 py-1">การชำระเงิน</th>
                      <th className="border px-2 py-1">ผู้จอง</th>
                      <th className="border px-2 py-1">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingList.map((b) => {
                      const period =
                        b.bookingType === "รายวัน"
                          ? `${fmtDate(b.fromDate)} - ${fmtDate(b.toDate)}`
                          : b.startMonth
                          ? `${fmtDate(b.startMonth)} • ${b.months || 1} เดือน`
                          : `${b.months || "-"} เดือน`;

                      return (
                        <tr key={b.id}>
                          <td className="border px-2 py-1">{b.slotId}</td>
                          <td className="border px-2 py-1">{b.bookingType}</td>
                          <td className="border px-2 py-1">{period}</td>
                          <td className="border px-2 py-1 text-center">
                            <StatusBadge s={b.status} />
                          </td>
                          <td className="border px-2 py-1">
                            {b.paymentSlipUrl ? (
                              <>
                                <a
                                  href={b.paymentSlipUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline block"
                                >
                                  ดูสลิป
                                </a>
                                <p className="text-xs italic">
                                  {b.paymentStatus || "ยังไม่จ่าย"}
                                </p>
                              </>
                            ) : (
                              <span className="text-gray-400 text-xs italic">
                                ไม่มีสลิป
                              </span>
                            )}
                          </td>
                          <td className="border px-2 py-1">
                            <div className="text-xs">
                              <div className="font-medium">{b.name || "-"}</div>
                              <div className="text-gray-600">{b.phone || "-"}</div>
                            </div>
                          </td>
                          <td className="border px-2 py-1">
                            <div className="flex flex-wrap gap-1">
                              {/* การจอง: pending → approve/reject */}
                              {b.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => updateBookingStatus(b.id, "approved")}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-xs"
                                  >
                                    ✅ อนุมัติ
                                  </button>
                                  <button
                                    onClick={() => updateBookingStatus(b.id, "rejected")}
                                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded text-xs"
                                  >
                                    ❌ ปฏิเสธ
                                  </button>
                                </>
                              )}

                              {/* การชำระเงิน: waiting → paid/rejected */}
                              {b.status === "approved" && (b.paymentStatus === "waiting" || b.paymentSlipUrl) && (
                                <>
                                  <button
                                    onClick={() => updatePaymentStatus(b.id, "paid")}
                                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded text-xs"
                                  >
                                    💰 ยืนยันชำระ
                                  </button>
                                  <button
                                    onClick={() => updatePaymentStatus(b.id, "rejected")}
                                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded text-xs"
                                  >
                                    🧾 ปฏิเสธสลิป
                                  </button>
                                </>
                              )}

                              {/* ยกเลิก (กรณี owner ต้องการยุติ) */}
                              {["approved"].includes(b.status) && (
                                <button
                                  onClick={() => updateBookingStatus(b.id, "cancelled")}
                                  className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-0.5 rounded text-xs"
                                >
                                  🛑 ยกเลิก
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500">ยังไม่มีรายการจอง</p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default OwnerDashboard;
