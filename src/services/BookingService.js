import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";

/**
 * ดึงรายการจองทั้งหมดของตลาดนั้นๆ
 * @param {string} marketId
 * @returns {Promise<Array>}
 */
export const getBookingsByMarket = async (marketId) => {
  const q = query(collection(db, "bookings"), where("marketId", "==", marketId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * ตรวจสอบว่าล็อกนี้ถูกจองแล้วหรือไม่
 * @param {Array} bookings
 * @param {string} slotId
 * @returns {boolean}
 */
export const isSlotBooked = (bookings, slotId) => {
  return bookings.some((b) => b.slotId === slotId);
};

/**
 * สร้างการจองใหม่
 * @param {Object} payload - { marketId, slotId, userId }
 * @returns {Promise}
 */
export const createBooking = async ({ marketId, slotId, userId }) => {
  if (!userId) throw new Error("ต้องเข้าสู่ระบบก่อนทำการจอง");

  return await addDoc(collection(db, "bookings"), {
    marketId,
    slotId,
    userId,
    bookedAt: Timestamp.now(),
  });
};
