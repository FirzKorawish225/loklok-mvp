// src/services/BookingService.js
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  deleteDoc,
  Timestamp,   // (ถ้าไม่ได้ใช้ updateDoc ในไฟล์นี้ ก็ไม่ต้อง import)
} from "firebase/firestore";



/** ---------- Utils ---------- */
const isRangeOverlap = (aStart, aEnd, bStart, bEnd) =>
  aStart <= bEnd && bStart <= aEnd;

const sendNotification = async ({ toUserId, type, title, message, data = {} }) => {
  if (!toUserId) return;
  await addDoc(collection(db, "notifications"), {
    toUserId,
    type, // booking_created | booking_submitted | booking_status_changed
    title,
    message,
    data,
    read: false,
    createdAt: Timestamp.now(),
  });
};

/** ---------- Reads ---------- */
export const getBookingsByMarket = async (marketId) => {
  const q = query(collection(db, "bookings"), where("marketId", "==", marketId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const isSlotBooked = (bookings, slotId) =>
  bookings.some((b) => b.slotId === slotId);

/** ---------- Create booking (with overlap protection) ---------- */
export const createBooking = async (payload) => {
  const {
    marketId,
    slotId,
    userId,
    bookingType, // "รายวัน" | "รายเดือน"
    fromDate,
    toDate,
    months,
    startMonth, // "YYYY-MM"
  } = payload;

  // ผู้ใช้ (snapshot ไว้ในเอกสาร)
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : {};

  // ตลาด
  const marketRef = doc(db, "markets", marketId);
  const marketSnap = await getDoc(marketRef);
  if (!marketSnap.exists()) throw new Error("Market not found");
  const market = marketSnap.data();

  // ราคา snapshot
  const slotDef = (market.layout || []).find((s) => s.i === slotId) || {};
  const priceDaily = Number(slotDef.priceDaily || 0);
  const priceMonthly = Number(slotDef.priceMonthly || 0);

  // คำนวนช่วงเวลาเป้าหมาย
  let start, end, computedMonths = null, startMonthDate = null;
  if (bookingType === "รายวัน") {
    start = new Date(fromDate);
    end = new Date(toDate);
    if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end)) {
      throw new Error("กรุณาระบุช่วงวันที่ให้ถูกต้อง");
    }
    if (end < start) throw new Error("วันที่สิ้นสุดต้องไม่ก่อนวันเริ่ม");
  } else if (bookingType === "รายเดือน") {
    if (!months || months < 1) throw new Error("กรุณาระบุจำนวนเดือนให้ถูกต้อง");
    if (!startMonth) throw new Error("กรุณาเลือกเดือนเริ่มต้น");
    const [yy, mm] = startMonth.split("-").map((v) => parseInt(v, 10));
    startMonthDate = new Date(yy, mm - 1, 1);
    start = new Date(startMonthDate);
    end = new Date(yy, mm - 1 + months, 0); // วันสุดท้ายของเดือนสิ้นสุด
    computedMonths = months;
  } else {
    throw new Error("ประเภทการจองไม่ถูกต้อง");
  }

  // ตรวจทับซ้อน (เฉพาะ slot เดียวกัน, ไม่รวม rejected/cancelled)
  const qBookings = query(
    collection(db, "bookings"),
    where("marketId", "==", marketId),
    where("slotId", "==", slotId)
  );
  const snap = await getDocs(qBookings);
  const active = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((b) => !["rejected", "cancelled"].includes(b.status || ""));

  for (const b of active) {
    if (b.bookingType === "รายวัน") {
      const bs = b.fromDate?.toDate?.() ?? new Date(b.fromDate);
      const be = b.toDate?.toDate?.() ?? new Date(b.toDate);
      if (isRangeOverlap(start, end, bs, be)) {
        throw new Error("ช่วงวันที่ทับซ้อนกับการจองเดิม");
      }
    } else if (b.bookingType === "รายเดือน") {
      const bs = b.startMonth?.toDate?.() ?? new Date(b.startMonth);
      const be = new Date(bs.getFullYear(), bs.getMonth() + (b.months || 1), 0);
      if (isRangeOverlap(start, end, bs, be)) {
        throw new Error("ช่วงเดือนทับซ้อนกับการจองเดิม");
      }
    }
  }

  // สร้าง booking (pending)
  const bookingDoc = {
    marketId,
    slotId,
    userId,
    bookingType,
    status: "pending",
    createdAt: Timestamp.now(),
    // snapshot contact
    name: userData.name || "",
    phone: userData.phone || "",
    address: userData.address || "",
    // pricing
    priceDaily,
    priceMonthly,
  };

  if (bookingType === "รายวัน") {
    bookingDoc.fromDate = Timestamp.fromDate(start);
    bookingDoc.toDate = Timestamp.fromDate(end);
  } else {
    bookingDoc.startMonth = Timestamp.fromDate(startMonthDate);
    bookingDoc.months = computedMonths;
  }

  const created = await addDoc(collection(db, "bookings"), bookingDoc);

  // แจ้งเตือน owner
  await sendNotification({
    toUserId: market.ownerUid,
    type: "booking_created",
    title: "มีคำขอจองใหม่",
    message: `มีคำขอจอง ${slotId} ในตลาด ${market.name}`,
    data: { marketId, slotId, bookingId: created.id },
  });

  // แจ้งเตือนผู้จอง (ยืนยันการส่งคำขอ)
  await sendNotification({
    toUserId: userId,
    type: "booking_submitted",
    title: "ส่งคำขอจองสำเร็จ",
    message: `คำขอของคุณสำหรับจุด ${slotId} ในตลาด ${market.name} อยู่ในสถานะ pending`,
    data: { marketId, slotId, bookingId: created.id, status: "pending" },
  });

  return created.id;
};

/** ---------- Cancel booking ---------- */
export const cancelBooking = async (bookingId) => {
  await deleteDoc(doc(db, "bookings", bookingId));
};

/** ---------- Notify on status change (used by OwnerDashboard) ---------- */
export const notifyStatusChange = async ({
  toUserId,
  marketName,
  slotId,
  status,
  bookingId,
}) => {
  await sendNotification({
    toUserId,
    type: "booking_status_changed",
    title: "อัปเดตสถานะการจอง",
    message: `สถานะการจอง ${slotId} ในตลาด ${marketName} ถูกอัปเดตเป็น ${status}`,
    data: { bookingId, status },
  });
};
