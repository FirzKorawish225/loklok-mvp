// imports
import React, { useState } from "react";
import MarketGrid from "../components/MarketGrid";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

const Market = () => {
  const [stalls, setStalls] = useState([]);

  const addStall = () => {
    const newStall = {
      id: Date.now(),
      name: `Stall ${stalls.length + 1}`,
      price: 100,
    };
    setStalls([...stalls, newStall]);
  };

  const editStall = (index, field, value) => {
    const updated = [...stalls];
    updated[index][field] = value;
    setStalls(updated);
  };

  const deleteStall = (index) => {
    const updated = stalls.filter((_, i) => i !== index);
    setStalls(updated);
  };

  const saveLayout = async () => {
    try {
      await addDoc(collection(db, "marketLayouts"), {
        name: `My Market ${Date.now()}`,
        stalls,
        createdAt: new Date()
      });
      alert("บันทึก Layout สำเร็จ!");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Market Layout Builder</h1>
      <div className="flex gap-4 mb-4">
        <button
          onClick={addStall}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          ➕ เพิ่มล็อก
        </button>
        <button
          onClick={saveLayout}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          💾 บันทึก Layout
        </button>
      </div>
      <MarketGrid
        stalls={stalls}
        onEdit={editStall}
        onDelete={deleteStall}
      />
    </div>
  );
};

export default Market;
