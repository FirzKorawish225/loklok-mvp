import React, { useState } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import {
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);
const mapContainerStyle = {
  width: "100%",
  height: "400px",
};
const center = {
  lat: 13.736717,
  lng: 100.523186,
};

const MarketBuilder = () => {
  const { user } = useAuth();
  const [marketName, setMarketName] = useState("");
  const [description, setDescription] = useState("");
  const [layout, setLayout] = useState([]);
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const handleAddSlot = () => {
    const newSlot = {
      i: `S${layout.length + 1}`,
      x: (layout.length * 2) % 12,
      y: Infinity,
      w: 2,
      h: 2,
      type: "both",// หรือ "monthly", หรือ "both"
    };
    setLayout([...layout, newSlot]);
  };

  const handleSave = async () => {
    try {
      if (!user) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        return;
      }
      if (!lat || !lng) {
        alert("กรุณาเลือกตำแหน่งบนแผนที่");
        return;
      }

      const cleanedLayout = layout.map((slot) => ({
  i: slot.i ?? "",
  x: typeof slot.x === "number" ? slot.x : 0,
  y: typeof slot.y === "number" && isFinite(slot.y) ? slot.y : 0,
  w: typeof slot.w === "number" ? slot.w : 2,
  h: typeof slot.h === "number" ? slot.h : 2,
  type: slot.type || "both", 
}));

      await addDoc(collection(db, "markets"), {
        name: marketName,
        description,
        location,
        lat,
        lng,
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

  const handleMapClick = (event) => {
  const lat = event.latLng.lat();
  const lng = event.latLng.lng();
  setLat(lat);
  setLng(lng);

  const geocoder = new window.google.maps.Geocoder();
  geocoder.geocode({ location: { lat, lng } }, (results, status) => {
  console.log(results); // ✅ ตรวจว่าได้ address หรือไม่

  if (status === "OK" && results[0]) {
    const province = results[0].address_components.find((component) =>
      component.types.includes("administrative_area_level_1")
    );
    if (province) {
      setLocation(province.long_name);
    } else {
      setLocation(results[0].formatted_address);
    }
  } else {
    console.error("Geocoder failed due to: " + status);
  }
});
};


  if (loadError) return <p>ไม่สามารถโหลดแผนที่ได้</p>;
  if (!isLoaded) return <p>กำลังโหลดแผนที่...</p>;

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
      <input
        type="text"
        placeholder="จังหวัด"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="border p-2 w-full mb-3"
      />
      <textarea
        placeholder="คำอธิบายตลาด"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <div className="h-[400px] mb-4">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={10}
          center={lat && lng ? { lat, lng } : center}
          onClick={handleMapClick}
        >
          {lat && lng && <Marker position={{ lat, lng }} />}
        </GoogleMap>
      </div>

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
        {layout.map((slot, index) => (
  <div key={slot.i} className="border rounded shadow-md p-1 text-sm bg-white">
    <div className="font-medium mb-1">{slot.i}</div>
    <select
      className="text-xs border rounded w-full mb-1"
      value={slot.type || "both"}
      onChange={(e) => {
        const updated = layout.map((s) =>
          s.i === slot.i ? { ...s, type: e.target.value } : s
        );
        setLayout(updated);
      }}
    >
      <option value="daily">รายวัน</option>
      <option value="monthly">รายเดือน</option>
      <option value="both">รายวัน/รายเดือน</option>
    </select>
  </div>
))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default MarketBuilder;
