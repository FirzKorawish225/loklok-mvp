import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Responsive, WidthProvider } from "react-grid-layout";
import { Link } from "react-router-dom";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const MyMarkets = () => {
  const { user } = useAuth();
  const [markets, setMarkets] = useState([]);

  useEffect(() => {
    const fetchMarkets = async () => {
      if (!user) return;
      const q = query(
        collection(db, "markets"),
        where("ownerUid", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const userMarkets = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMarkets(userMarkets);
    };

    fetchMarkets();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">ตลาดของฉัน</h2>
      {markets.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีตลาดที่สร้างไว้</p>
      ) : (
        <div className="space-y-8">
          {markets.map((market, idx) => (
            <div key={market.id} className="border p-6 rounded shadow bg-white">
              <h3 className="text-xl font-semibold mb-1">{market.name}</h3>
              <p className="text-sm text-gray-600">{market.description}</p>
              <p className="text-xs text-gray-400 mt-1 mb-3">Market ID: {market.id}</p>
                <Link 
                    to={`/market/${market.id}`} 
                    className="mt-2 inline-block text-blue-500 hover:underline text-sm"
                >
                    ดู / แก้ไข
                </Link>
              <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: market.layout }}
                breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                cols={{ lg: 12, md: 10, sm: 6 }}
                rowHeight={50}
                isDraggable={false}
                isResizable={false}
                compactType={null}
              >
                {market.layout?.map((slot, index) => (
                  <div
                    key={slot.i}
                    className="border rounded shadow flex items-center justify-center text-sm font-semibold text-gray-700"
                    style={{
                      backgroundColor: `hsl(${(index * 45) % 360}, 70%, 85%)`,
                    }}
                  >
                    {slot.i}
                  </div>
                ))}
              </ResponsiveGridLayout>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMarkets;

