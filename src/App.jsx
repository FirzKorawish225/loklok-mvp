import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Market from "./pages/Market";
import MyMarkets from "./pages/MyMarkets";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import MarketBuilder from "./pages/MarketBuilder";
import MarketEditor from "./pages/MarketEditor";
import MarketPublicView from "./pages/MarketPublicView";
import Marketplace from "./pages/Marketplace";
import MarketBookingOverview from "./pages/MarketBookingOverview";
import Register from "./pages/Register";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import BookingList from "./admin/BookingList";
import MarketplaceMap from "./pages/MarketplaceMap";
import MyBookings from "./pages/MyBookings";
import AdminBookingList from "./pages/AdminBookingList";
import OwnerDashboard from "./pages/OwnerDashboard";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplacemap" element={<MarketplaceMap />} />
        <Route path="/market-view/:marketId" element={<MarketPublicView />} />
        <Route path="/market/:id/bookings" element={<MarketBookingOverview />} />
        <Route path="/market/:id" element={<MarketEditor />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        <Route
          path="/market"
          element={
            <ProtectedRoute>
              <Market />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-markets"
          element={
            <ProtectedRoute>
              <MyMarkets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/market-builder"
          element={
            <ProtectedRoute>
              <MarketBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route path="/admin/bookings" element={<BookingList />} />
        <Route path="/admin/bookings" element={<AdminBookingList />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
