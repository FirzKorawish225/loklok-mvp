import React, { useState } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const MarketBuilder = () => {
  const { user } = useAuth();
  const [marketName, setMarketName] = useState("");
  const [description, setDescription] = useState("");
  const [layout, setLayout] = useState([]);

  const handleAddSlot = () => {
    const newSlot = {
      i: `S${layout.length + 1}`,
      x: (layout.length * 2) % 12,
      y: Infinity, // Put it at the bottom
      w: 2,
      h: 2,
    };
    setLayout([...layout, newSlot]);
  };

const handleSave = async () => {
  try {
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    // ✅ ตรวจสอบและแปลง layout ให้ไม่มี field undefined
    const cleanedLayout = layout.map((slot) => ({
      i: slot.i ?? "",
      x: typeof slot.x === "number" ? slot.x : 0,
      y: typeof slot.y === "number" && isFinite(slot.y) ? slot.y : 0,
      w: typeof slot.w === "number" ? slot.w : 2,
      h: typeof slot.h === "number" ? slot.h : 2,
    }));

    console.log("Saving market:", {
      name: marketName,
      description,
      ownerUid: user.uid,
      layout: cleanedLayout,
    });

    await addDoc(collection(db, "markets"), {
      name: marketName,
      description,
      ownerUid: user.uid,
      createdAt: serverTimestamp(),
      layout: cleanedLayout,
    });

    alert("บันทึกตลาดเรียบร้อยแล้ว");
  } catch (err) {
    console.error("Error saving market:", err);
    alert("บันทึกไม่สำเร็จ กรุณาลองใหม่");
  }
};


  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Market Layout Builder</h1>

        <p className="text-sm text-gray-500 mb-2">
      * คุณสามารถลากและจัดตำแหน่งล็อกได้ตามต้องการ
    </p>


      <input
        type="text"
        placeholder="ชื่อตลาด"
        value={marketName}
        onChange={(e) => setMarketName(e.target.value)}
        className="border p-2 w-full mb-3"
      />
      <textarea
        placeholder="คำอธิบายตลาด"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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
          onClick={handleSave}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          บันทึกตลาด
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
        {layout.map((slot, index) =>  (
            <div
                key={slot.i}
                style={{ backgroundColor: `hsl(${(index * 50) % 360}, 70%, 80%)` }}
                className="border border-gray-400 rounded shadow-md flex items-center justify-center text-sm font-medium text-gray-800"
            >
             {slot.i}
            </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default MarketBuilder;
