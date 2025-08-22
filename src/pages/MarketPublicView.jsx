// src/pages/MarketPublicView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useAuth } from "../contexts/AuthContext";
import { Responsive, WidthProvider } from "react-grid-layout";
import { createBooking } from "../services/BookingService";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);
const mapContainerStyle = { width: "100%", height: "400px" };

// ===== helper: overlap =====
const isOverlap = (aStart, aEnd, bStart, bEnd) => aStart <= bEnd && bStart <= aEnd;

// แปลง booking เป็นช่วงวันที่ start/end (Date)
const bookingRange = (b) => {
  if (b.bookingType === "รายวัน") {
    const s = b.fromDate?.toDate?.() ?? new Date(b.fromDate);
    const e = b.toDate?.toDate?.() ?? new Date(b.toDate);
    return [s, e];
  } else {
    const s = b.startMonth?.toDate?.() ?? new Date(b.startMonth); // วันที่ 1 ของเดือน
    // end = วันสุดท้ายของช่วงเดือน
    const e = new Date(s.getFullYear(), s.getMonth() + (b.months || 1), 0);
    return [s, e];
  }
};

// แปลง “ค่าที่ผู้ขายเลือก” เป็นช่วงวันที่ start/end (Date)
const selectionRange = ({ type, from, to, startMonth, months }) => {
  if (type === "รายวัน") {
    if (!from || !to) return null;
    return [new Date(from), new Date(to)];
  }
  if (type === "รายเดือน") {
    if (!startMonth || !months || Number(months) < 1) return null;
    const [yy, mm] = startMonth.split("-").map((v) => parseInt(v, 10));
    const s = new Date(yy, mm - 1, 1);
    const e = new Date(yy, mm - 1 + Number(months), 0);
    return [s, e];
  }
  return null;
};

const MarketPublicView = () => {
  const { marketId: id } = useParams();
  const { user } = useAuth();

  const [market, setMarket] = useState(null);
  const [allBookings, setAllBookings] = useState([]); // เก็บทั้งหมดแบบ realtime

  // ค่าที่ผู้ขายเลือก
  const [selectedType, setSelectedType] = useState({});
  const [fromDate, setFromDate] = useState({});
  const [toDate, setToDate] = useState({});
  const [months, setMonths] = useState({});
  const [startMonth, setStartMonth] = useState({});

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  // โหลดตลาด + subscribe bookings
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const ref = doc(db, "markets", id);
      const snap = await getDoc(ref);
      if (snap.exists()) setMarket(snap.data());

      const q = query(collection(db, "bookings"), where("marketId", "==", id));
      unsub = onSnapshot(q, (s) => {
        const rows = s.docs.map((d) => ({ id: d.id, ...d.data() }));
        // เก็บเฉพาะสถานะที่ยังมีผล
        const active = rows.filter((b) =>
          ["pending", "approved", "paid"].includes(b.status || "pending")
        );
        setAllBookings(active);
      });
    })();
    return () => unsub && unsub();
  }, [id]);

  // คำนวณจำนวน “จองแล้ว” ต่อจุด โดยดูการทับซ้อนกับช่วงที่ผู้ขายเลือก (ถ้าเลือก)
  const bookingMap = useMemo(() => {
    const map = {};
    (market?.layout || []).forEach((slot) => {
      const type = selectedType[slot.i];
      const selRange = selectionRange({
        type,
        from: fromDate[slot.i],
        to: toDate[slot.i],
        startMonth: startMonth[slot.i],
        months: months[slot.i],
      });

      let count = 0;
      const slotBookings = allBookings.filter((b) => b.slotId === slot.i);
      if (!selRange) {
        // ยังไม่ได้เลือกช่วง → นับทุก booking active ของล็อกนี้
        count = slotBookings.length;
      } else {
        // เลือกช่วงแล้ว → นับเฉพาะที่ทับซ้อนช่วงที่เลือก
        const [selStart, selEnd] = selRange;
        count = slotBookings.reduce((acc, b) => {
          const [bs, be] = bookingRange(b);
          return acc + (isOverlap(selStart, selEnd, bs, be) ? 1 : 0);
        }, 0);
      }
      map[slot.i] = count;
    });
    return map;
  }, [market?.layout, allBookings, selectedType, fromDate, toDate, startMonth, months]);

  const handleBooking = async (slotId) => {
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนทำการจอง");
      return;
    }
    const type = selectedType[slotId];
    if (!type) {
      alert("กรุณาเลือกประเภทการจอง");
      return;
    }

    try {
      if (type === "รายวัน") {
        if (!fromDate[slotId] || !toDate[slotId]) {
          alert("กรุณาเลือกช่วงวันที่สำหรับการจองรายวัน");
          return;
        }
        await createBooking({
          marketId: id,
          slotId,
          userId: user.uid,
          bookingType: "รายวัน",
          fromDate: fromDate[slotId],
          toDate: toDate[slotId],
        });
      } else {
        if (!months[slotId] || Number(months[slotId]) < 1) {
          alert("กรุณาระบุจำนวนเดือนให้ถูกต้อง");
          return;
        }
        if (!startMonth[slotId]) {
          alert("กรุณาเลือกเดือนเริ่มต้น");
          return;
        }
        await createBooking({
          marketId: id,
          slotId,
          userId: user.uid,
          bookingType: "รายเดือน",
          months: Number(months[slotId]),
          startMonth: startMonth[slotId], // "YYYY-MM"
        });
      }
      alert("ส่งคำขอจองสำเร็จ (สถานะ: pending)!");
      // ไม่ต้อง reload — onSnapshot จะอัปเดตตัวเลขให้อัตโนมัติ
    } catch (err) {
      alert(`ไม่สามารถจองได้: ${err.message}`);
      console.error(err);
    }
  };

  if (!market) return <p className="p-6">กำลังโหลดข้อมูลตลาด...</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">ตลาด: {market.name}</h1>
      <p className="mb-1 text-gray-600">จังหวัด: {market.location || market.description}</p>
      <p className="mb-4 text-gray-500">
        พิกัด: {market.lat}, {market.lng}
      </p>

      {isLoaded &&
        typeof market.lat === "number" &&
        typeof market.lng === "number" && (
          <div className="mb-6">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={{ lat: market.lat, lng: market.lng }}
              zoom={15}
            >
              <Marker position={{ lat: market.lat, lng: market.lng }} />
            </GoogleMap>
          </div>
        )}

      <ResponsiveGridLayout
        className="layout mb-8"
        layouts={{ lg: market.layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={50}
        isDraggable={false}
        isResizable={false}
      >
        {market.layout?.map((slot, idx) => {
          const availableTypes =
            market.slotTypes?.[slot.i] ||
            (slot.type === "both"
              ? ["รายวัน", "รายเดือน"]
              : slot.type === "daily"
              ? ["รายวัน"]
              : slot.type === "monthly"
              ? ["รายเดือน"]
              : []);
          const bookedCount = bookingMap[slot.i] || 0;
          const isBooked = bookedCount > 0;

          return (
            <div
              key={slot.i}
              className="rounded border p-2 flex flex-col justify-between shadow text-sm"
              style={{
                backgroundColor: isBooked ? "#CBD5E0" : "#68D391",
                color: isBooked ? "#000" : "#fff",
              }}
            >
              <strong className="text-md text-center mb-1">จุด: {slot.i}</strong>
              <p className="text-xs text-center mb-1">
                จองทับช่วงที่เลือก: {bookedCount}
              </p>

              <div className="text-xs text-center mb-2 text-black">
                {slot.priceDaily ? `รายวัน: ฿${slot.priceDaily}` : null}
                {slot.priceMonthly ? ` | รายเดือน: ฿${slot.priceMonthly}` : null}
              </div>

              {availableTypes.length > 0 ? (
                <>
                  <select
                    value={selectedType[slot.i] || ""}
                    onChange={(e) =>
                      setSelectedType({ ...selectedType, [slot.i]: e.target.value })
                    }
                    className="border p-1 text-xs w-full mb-1 text-black"
                  >
                    <option value="">เลือกประเภท</option>
                    {availableTypes.includes("รายวัน") && (
                      <option value="รายวัน">รายวัน</option>
                    )}
                    {availableTypes.includes("รายเดือน") && (
                      <option value="รายเดือน">รายเดือน</option>
                    )}
                  </select>

                  {selectedType[slot.i] === "รายวัน" && (
                    <>
                      <input
                        type="date"
                        className="border p-1 text-xs w-full mb-1 text-black"
                        onChange={(e) =>
                          setFromDate({ ...fromDate, [slot.i]: e.target.value })
                        }
                      />
                      <input
                        type="date"
                        className="border p-1 text-xs w-full mb-1 text-black"
                        onChange={(e) =>
                          setToDate({ ...toDate, [slot.i]: e.target.value })
                        }
                      />
                    </>
                  )}

                  {selectedType[slot.i] === "รายเดือน" && (
                    <>
                      <input
                        type="month"
                        className="border p-1 text-xs w-full mb-1 text-black"
                        onChange={(e) =>
                          setStartMonth({ ...startMonth, [slot.i]: e.target.value })
                        }
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="จำนวนเดือน"
                        className="border p-1 text-xs w-full mb-1 text-black"
                        onChange={(e) =>
                          setMonths({ ...months, [slot.i]: e.target.value })
                        }
                      />
                    </>
                  )}

                  <button
                    onClick={() => handleBooking(slot.i)}
                    className="bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600 w-full"
                  >
                    ส่งคำขอจอง
                  </button>
                </>
              ) : (
                <p className="text-xs text-center text-red-700 bg-white/80 rounded p-1">
                  ไม่เปิดให้จอง
                </p>
              )}
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
};

export default MarketPublicView;
