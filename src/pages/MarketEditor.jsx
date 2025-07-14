import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const MarketEditor = () => {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [market, setMarket] = useState(null);
  const [layout, setLayout] = useState([]);
  const [bookingCounts, setBookingCounts] = useState({});

  useEffect(() => {
    const fetchMarket = async () => {
      const docRef = doc(db, "markets", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMarket(data);
        setLayout(data.layout || []);
        setName(data.name || "");
        setDescription(data.description || "");
      }
    };

    const fetchBookingCounts = async () => {
      const q = query(collection(db, "bookings"), where("marketId", "==", id));
      const snapshot = await getDocs(q);
      const counts = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        const slotId = data.slotId;
        counts[slotId] = (counts[slotId] || 0) + 1;
      });
      setBookingCounts(counts);
    };

    fetchMarket();
    fetchBookingCounts();
  }, [id]);

  const handleAddSlot = () => {
    const newSlot = {
      i: `S${layout.length + 1}`,
      x: (layout.length * 2) % 12,
      y: Infinity,
      w: 2,
      h: 2,
    };
    setLayout([...layout, newSlot]);
  };

  const handleRemoveLastSlot = () => {
    if (layout.length === 0) return;
    setLayout(layout.slice(0, -1));
  };

  const handleSave = async () => {
    if (!layout || !Array.isArray(layout)) {
      alert("ไม่พบ layout ที่จะบันทึก");
      return;
    }

    const cleanedLayout = layout.map(({ x, y, w, h, i }) => ({
      x,
      y,
      w,
      h,
      i,
    }));

    try {
      const docRef = doc(db, "markets", id);
      await updateDoc(docRef, {
        name,
        description,
        layout: cleanedLayout,
      });
      alert("บันทึก Layout เรียบร้อยแล้ว");
    } catch (err) {
      console.error("Error updating layout:", err);
      alert("เกิดข้อผิดพลาดในการบันทึก Layout");
    }
  };

  if (!market) return <p className="p-6">กำลังโหลดข้อมูล...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">แก้ไข: {market.name}</h1>

      <p className="text-sm text-gray-500 mb-3">
        * คุณสามารถเพิ่ม/ลบ/ลากจัดตำแหน่งล็อกได้ตามต้องการ
      </p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ชื่อตลาด"
        className="border p-2 w-full mb-2"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="คำอธิบายตลาด"
        className="border p-2 w-full mb-4"
      />

      <div className="flex gap-4 mb-4">
        <button
          onClick={handleAddSlot}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          เพิ่มล็อก
        </button>
        <button
          onClick={handleRemoveLastSlot}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          ลบล็อกสุดท้าย
        </button>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        onLayoutChange={(newLayout) => setLayout(newLayout)}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={50}
        isResizable={true}
        isDraggable={true}
      >
        {layout.map((item, index) => (
          <div
            key={item.i}
            style={{
              backgroundColor: `hsl(${(index * 50) % 360}, 70%, 80%)`,
            }}
            className="border border-gray-400 rounded shadow-md flex flex-col items-center justify-center text-sm font-medium text-gray-800"
          >
            <strong>{item.i}</strong>
            <span className="text-xs text-gray-600">
              จองแล้ว: {bookingCounts[item.i] || 0}
            </span>
          </div>
        ))}
      </ResponsiveGridLayout>

      <button
        onClick={handleSave}
        className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        บันทึก Layout
      </button>
    </div>
  );
};

export default MarketEditor;
