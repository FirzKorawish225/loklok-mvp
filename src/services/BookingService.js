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
  Timestamp,
} from "firebase/firestore";

// ✅ ใช้ในหน้า MarketPublicView
export const getBookingsByMarket = async (marketId) => {
  const q = query(collection(db, "bookings"), where("marketId", "==", marketId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const isSlotBooked = (bookings, slotId) => {
  return bookings.some((b) => b.slotId === slotId);
};

export const createBooking = async ({ marketId, slotId, userId }) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists()
    ? userSnap.data()
    : { displayName: "", phone: "", address: "" };

  await addDoc(collection(db, "bookings"), {
    marketId,
    slotId,
    userId,
    createdAt: Timestamp.now(),
    name: userData.name || "",
    phone: userData.phone || "",
    address: userData.address || "",
  });
};

export const cancelBooking = async (bookingId) => {
  await deleteDoc(doc(db, "bookings", bookingId));
};
