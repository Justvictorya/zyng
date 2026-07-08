import React from "react";
import { Navigate } from "react-router-dom";
import { useZyng } from "../context/ZyngContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useZyng();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
