import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";

const MyMarkets = () => {
  const [layouts, setLayouts] = useState([]);

  useEffect(() => {
    const fetchLayouts = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "marketLayouts"),
        where("uid", "==", user.uid)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLayouts(data);
    };

    fetchLayouts();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Layout ของฉัน</h1>
      {layouts.length === 0 ? (
        <p>ยังไม่มี Layout</p>
      ) : (
        <ul className="space-y-3">
          {layouts.map((layout) => (
            <li key={layout.id} className="border p-4 rounded bg-white">
              <strong>{layout.name}</strong> – {layout.stalls.length} ล็อก
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyMarkets;
