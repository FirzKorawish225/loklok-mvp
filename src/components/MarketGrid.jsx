import React from "react";

const MarketGrid = ({ stalls, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {stalls.map((stall, index) => (
        <div
          key={stall.id}
          className="bg-white shadow p-4 border rounded hover:bg-yellow-50"
        >
          <input
            type="text"
            value={stall.name}
            onChange={(e) => onEdit(index, "name", e.target.value)}
            className="w-full font-bold mb-2 border p-1"
          />
          <input
            type="number"
            value={stall.price}
            onChange={(e) => onEdit(index, "price", Number(e.target.value))}
            className="w-full border p-1 mb-2"
          />
          <button
            onClick={() => onDelete(index)}
            className="bg-red-500 text-white px-2 py-1 text-sm rounded"
          >
            ลบ
          </button>
        </div>
      ))}
    </div>
  );
};

export default MarketGrid;

