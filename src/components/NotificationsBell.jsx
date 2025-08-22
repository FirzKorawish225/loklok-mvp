import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const NotificationsBell = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("toUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user?.uid]);

  const unread = items.filter(n => !n.read).length;

  const markAllRead = async () => {
    const unreadList = items.filter(n => !n.read);
    await Promise.all(
      unreadList.map(n => updateDoc(doc(db, "notifications", n.id), { read: true }))
    );
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative px-2 py-1 rounded border"
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white border rounded shadow z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <b>การแจ้งเตือน</b>
            <button onClick={markAllRead} className="text-xs text-blue-600 underline">
              มาร์คอ่านทั้งหมด
            </button>
          </div>
          {items.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500">ยังไม่มีการแจ้งเตือน</div>
          ) : (
            <ul className="divide-y">
              {items.map(n => (
                <li key={n.id} className={`px-3 py-2 text-sm ${n.read ? "text-gray-600" : "font-medium"}`}>
                  <div className="flex items-center justify-between">
                    <span>{n.title || "แจ้งเตือน"}</span>
                    <span className="text-[10px] text-gray-400">
                      {n.createdAt?.toDate?.()?.toLocaleString?.() || ""}
                    </span>
                  </div>
                  <div className="text-gray-700">{n.message}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
