import React, { useState } from "react";
import MarketGrid from "../components/MarketGrid";

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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Market Layout Builder</h1>
      <button
        onClick={addStall}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        ➕ เพิ่มล็อก
      </button>
      <MarketGrid
        stalls={stalls}
        onEdit={editStall}
        onDelete={deleteStall}
      />
    </div>
  );
};

export default Market;
