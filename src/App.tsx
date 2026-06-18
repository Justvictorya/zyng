import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardLayout from "./pages/DashboardLayout";

import ViewDashboard from "./components/ViewDashboard";
import ViewCreatePost from "./components/ViewCreatePost";
import ViewPostsHistory from "./components/ViewPostsHistory";
import ViewAnalytics from "./components/ViewAnalytics";
import ViewSettings from "./components/ViewSettings";

export default function App() {
  return (
    <div className="bg-[#050507] min-h-screen text-slate-100 font-sans selection:bg-purple-500/30 selection:text-white overflow-x-hidden" id="zyng-root-viewport">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ViewDashboard />} />
          <Route path="create-post" element={<ViewCreatePost />} />
          <Route path="posts" element={<ViewPostsHistory />} />
          <Route path="analytics" element={<ViewAnalytics />} />
          <Route path="settings" element={<ViewSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
