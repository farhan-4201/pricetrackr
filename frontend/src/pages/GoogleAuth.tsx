"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function GoogleAuth() {
  const navigate = useNavigate();
  const { clearError } = useAuth();

  useEffect(() => {
    const handleGoogleAuth = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      const userStr = urlParams.get("user");

      if (token && userStr) {
        try {
          const userData = JSON.parse(decodeURIComponent(userStr));

          // Store user data and token in localStorage
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(userData));

          // Clear any previous errors
          clearError();

          // Redirect to dashboard
          navigate("/dashboard", { replace: true });
        } catch (error) {
          console.error("Google auth error:", error);
          // Redirect to signin if there's an error
          navigate("/signin?error=auth_failed", { replace: true });
        }
      } else {
        // Redirect to signin if no token/user data
        navigate("/signin?error=auth_failed", { replace: true });
      }
    };

    handleGoogleAuth();
  }, [navigate, clearError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-white mt-4">Completing sign in...</p>
      </div>
    </div>
  );
}
