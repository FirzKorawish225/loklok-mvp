// src/pages/MarketplaceMap.jsx
import React, { useEffect, useState } from "react";
import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

const defaultCenter = {
  lat: 13.7563, // Bangkok
  lng: 100.5018,
};

const MarketplaceMap = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });
console.log("Google Maps API Key:", process.env.REACT_APP_GOOGLE_MAPS_API_KEY);
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      const snapshot = await getDocs(collection(db, "markets"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const marketsWithLocation = data.filter(m => m.lat && m.lng);
      setMarkets(marketsWithLocation);
    };
    fetchMarkets();
  }, []);

  if (loadError) return <p>ไม่สามารถโหลดแผนที่ได้</p>;
  if (!isLoaded) return <p>กำลังโหลดแผนที่...</p>;

  const mapCenter = markets.length > 0
    ? { lat: markets[0].lat, lng: markets[0].lng }
    : defaultCenter;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">แผนที่ตลาดทั้งหมด</h2>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={6}
        center={mapCenter}
      >
        {markets.map((market) => (
          <Marker
            key={market.id}
            position={{ lat: market.lat, lng: market.lng }}
            onClick={() => setSelectedMarket(market)}
          />
        ))}

        {selectedMarket && (
          <InfoWindow
            position={{ lat: selectedMarket.lat, lng: selectedMarket.lng }}
            onCloseClick={() => setSelectedMarket(null)}
          >
            <div className="max-w-[200px]">
              <h3 className="font-bold text-sm">{selectedMarket.name}</h3>
              <p className="text-xs text-gray-600">{selectedMarket.description}</p>
              <Link
                to={`/market/${selectedMarket.id}`}
                className="text-blue-500 underline text-xs"
              >
                ดูรายละเอียด
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default MarketplaceMap;
