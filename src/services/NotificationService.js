// src/services/NotificationService.js
import { db } from "../firebase";
import {
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

/**
 * subscribeMyNotifications
 * realtime stream ของ notifications ของผู้ใช้
 * @param {string} userId
 * @param {(items: any[]) => void} cb
 * @returns {() => void} unsubscribe
 */
export const subscribeMyNotifications = (userId, cb) => {
  if (!userId) return () => {};
  const q = query(
    collection(db, "notifications"),
    where("toUserId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(items);
  });
};

/** มาร์คแจ้งเตือนเป็นอ่าน */
export const markAsRead = async (notificationId) => {
  if (!notificationId) return;
  await updateDoc(doc(db, "notifications", notificationId), { read: true });
};

/**
 * pushNotification
 * @param {{toUserId:string,type:string,title:string,message:string,data?:object}} param0
 */
export async function pushNotification({
  toUserId,
  type,
  title,
  message,
  data = {},
}) {
  if (!toUserId) return;
  await addDoc(collection(db, "notifications"), {
    toUserId,
    type,       // booking_created | booking_submitted | payment_slip_uploaded | booking_status_changed
    title,
    message,
    data,
    read: false,
    createdAt: Timestamp.now(),
  });
}
