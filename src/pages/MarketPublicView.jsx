import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { Responsive, WidthProvider } from "react-grid-layout";
import {
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";
import {
  getBookingsByMarket,
  isSlotBooked,
  createBooking,
  cancelBooking,
} from "../services/BookingService";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const MarketPublicView = () => {
  const { user } = useAuth();
  const { marketId } = useParams();
  const [market, setMarket] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedBookingType, setSelectedBookingType] = useState("daily");

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "markets", marketId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMarket(docSnap.data());
        }

        const bookingData = await getBookingsByMarket(marketId);
        setBookings(bookingData);
      } catch (err) {
        console.error("โหลดข้อมูลล้มเหลว", err);
      }
    };

    fetchData();
  }, [marketId]);
  const [selectedType, setSelectedType] = useState({});

const handleTypeChange = (slotId, type) => {
  setSelectedType((prev) => ({
    ...prev,
    [slotId]: type,
  }));
};
  const handleBooking = async (slotId, bookingType) => {
    if (!user) {
      alert("กรุณาเข้าสู่ระบบเพื่อทำการจอง");
      return;
    }

    if (isSlotBooked(bookings, slotId)) {
      alert("ล็อกนี้ถูกจองแล้ว");
      return;
    }

    try {
      await createBooking({
        marketId,
        slotId,
        userId: user.uid,
        bookingType,
        createdAt: new Date(),
      });
      alert("จองสำเร็จ!");
      window.location.reload();
    } catch (error) {
      console.error("Booking error:", error);
      alert("จองไม่สำเร็จ");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await cancelBooking(bookingId);
      alert("ยกเลิกการจองเรียบร้อย");
      window.location.reload();
    } catch (err) {
      console.error("Cancel error:", err);
      alert("ยกเลิกการจองไม่สำเร็จ");
    }
  };

  if (loadError) return <p>ไม่สามารถโหลดแผนที่ได้</p>;
  if (!isLoaded) return <p>กำลังโหลดแผนที่...</p>;
  if (!market) return <p className="p-6">กำลังโหลด...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">ตลาด: {market.name}</h1>
      <p className="mb-1 text-gray-600">จังหวัด: {market.location}</p>
      <p className="mb-4 text-gray-600">
        พิกัด: {market.lat}, {market.lng}
      </p>

      {market.lat && market.lng && (
        <div className="h-[400px] mb-6">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={{ lat: market.lat, lng: market.lng }}
            zoom={14}
          >
            <Marker position={{ lat: market.lat, lng: market.lng }} />
          </GoogleMap>
        </div>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: market.layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={50}
        isDraggable={false}
        isResizable={false}
      >
        {market.layout.map((slot) => {
          const isBooked = isSlotBooked(bookings, slot.i);
          const myBooking = bookings.find(
            (b) => b.slotId === slot.i && b.userId === user?.uid
          );
          const isMine = !!myBooking;
          const availableTypes = slot.types || ["daily"];

          return (
            <div
              key={slot.i}
              style={{
                backgroundColor: isBooked
                  ? isMine
                    ? "#b2f5ea"
                    : "#e2e8f0"
                  : "#c6f6d5",
              }}
              className="border rounded shadow flex flex-col items-center justify-center text-sm text-gray-800 p-2"
            >
              <div className="font-bold">{slot.i}</div>

              {!isBooked ? (
                user ? (
                  <>
                    <select
                      value={selectedType[slot.i] || ""}
                      onChange={(e) => handleTypeChange(slot.i, e.target.value)}
                    >
                    {slot.type === "daily" || slot.type === "both" ? (
                      <option value="daily">รายวัน</option>
                    ) : null}
                    {slot.type === "monthly" || slot.type === "both" ? (
                      <option value="monthly">รายเดือน</option>
                    ) : null}
                    </select>
                    <button
                      className="text-xs text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                      onClick={() => handleBooking(slot.i, selectedBookingType)}
                    >
                      จอง
                    </button>
                  </>
                ) : (
                  <span className="text-xs mt-1 text-blue-700">
                    เข้าสู่ระบบเพื่อจอง
                  </span>
                )
              ) : isMine ? (
                <button
                  className="mt-1 text-xs text-white bg-red-500 px-2 py-1 rounded hover:bg-red-600"
                  onClick={() => handleCancelBooking(myBooking.id)}
                >
                  ยกเลิกจอง
                </button>
              ) : (
                <span className="text-gray-500 text-xs mt-1">จองแล้ว</span>
              )}
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
};

export default MarketPublicView;
