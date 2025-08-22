// src/pages/MyBookings.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [markets, setMarkets] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const q = query(collection(db, "bookings"), where("userId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      async (snap) => {
        const marketCache = { ...markets };
        const rows = [];

        for (const d of snap.docs) {
          const b = d.data();

          if (!marketCache[b.marketId]) {
            const mSnap = await getDoc(doc(db, "markets", b.marketId));
            marketCache[b.marketId] = mSnap.exists()
              ? mSnap.data().name || "ไม่ทราบชื่อตลาด"
              : "ไม่พบตลาด";
          }

          rows.push({ id: d.id, ...b, marketName: marketCache[b.marketId] });
        }

        setMarkets(marketCache);
        setBookings(rows);
        setLoading(false);
      },
      (e) => {
        console.error("onSnapshot bookings error:", e);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  const uploadSlipAndUpdateBooking = async (file, bookingId) => {
  try {
    if (!file) return;

    // 1) Upload ไปตาม Storage Rules
    const path = `payment-slips/${user.uid}/${bookingId}/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);

    // 2) อัปเดตเอกสาร booking
    await updateDoc(doc(db, "bookings", bookingId), {
      paymentStatus: "waiting",
      paymentSlipUrl: downloadURL,
      paymentStoragePath: path,
    });

    // 3) ยิงแจ้งเตือนหา Owner (ดึง ownerUid จาก markets)
    const bSnap = await getDoc(doc(db, "bookings", bookingId));
    const b = bSnap.data();
    const mSnap = await getDoc(doc(db, "markets", b.marketId));
    const market = mSnap.data() || {};

    await addDoc(collection(db, "notifications"), {
      toUserId: market.ownerUid,
      type: "payment_slip_uploaded",
      title: "มีสลิปการชำระเงินใหม่",
      message: `ผู้จองแนบสลิปสำหรับจุด ${b.slotId} ในตลาด ${market.name || "-"}`,
      data: { marketId: b.marketId, slotId: b.slotId, bookingId, paymentStatus: "waiting" },
      read: false,
      createdAt: Timestamp.now(),
    });

    alert("อัปโหลดสลิปสำเร็จ รอเจ้าของตลาดอนุมัติ ✅");
  } catch (err) {
    console.error("upload slip error:", err);
    alert(`อัปโหลดไม่สำเร็จ: ${err.message}`);
  }
};


  if (loading) return <p className="p-6">กำลังโหลดรายการจอง...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">รายการจองของฉัน</h1>

      {bookings.length === 0 ? (
        <p>ยังไม่มีรายการจอง</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isFinal = ["rejected", "cancelled", "paid"].includes(
              (b.paymentStatus || "").toLowerCase()
            );

            return (
              <div key={b.id} className="border p-4 rounded bg-white shadow-sm">
                <p><strong>ตลาด:</strong> {b.marketName}</p>
                <p><strong>ล็อก:</strong> {b.slotId}</p>
                <p><strong>ประเภท:</strong> {b.bookingType}</p>
                <p><strong>สถานะ:</strong> {b.status || "-"} / {b.paymentStatus || "-"}</p>

                {b.bookingType === "รายวัน" ? (
                  <>
                    <p><strong>จากวันที่:</strong> {b.fromDate?.toDate?.()?.toLocaleDateString?.() || "-"}</p>
                    <p><strong>ถึงวันที่:</strong> {b.toDate?.toDate?.()?.toLocaleDateString?.() || "-"}</p>
                  </>
                ) : (
                  <p><strong>จำนวนเดือน:</strong> {b.months} เดือน</p>
                )}

                <p className="text-sm text-gray-500 mt-2">
                  จองเมื่อ: {b.createdAt?.toDate?.()?.toLocaleString?.() || "-"}
                </p>

                {b.paymentSlipUrl && (
                  <p className="mt-2 text-xs">
                    📎{" "}
                    <a
                      href={b.paymentSlipUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 underline"
                    >
                      ดูสลิปที่แนบไว้
                    </a>
                  </p>
                )}

                {!isFinal && (
                  <div className="mt-3">
                    <label className="block text-sm mb-1">แนบสลิปการโอน:</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadSlipAndUpdateBooking(file, b.id);
                      }}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      รองรับภาพหรือ PDF; สถานะจะเป็น <b>waiting</b> จนกว่าเจ้าของตลาดจะตรวจ
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
