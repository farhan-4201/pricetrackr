
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus } from "lucide-react";

export default function SignUp() {
  const { signup, error, clearError, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [contactError, setContactError] = useState("");

  const validateContactNumber = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 10 || trimmed.length > 15) {
      return "Contact number must be between 10 and 15 characters";
    }
    if (!/^[+]?[\d\s\-().]+$/.test(trimmed)) {
      return "Contact number can only contain numbers, spaces, hyphens, parentheses, dots, and optional + prefix";
    }
    return "";
  };

  const handleContactNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContactNumber(value);
    const error = validateContactNumber(value);
    setContactError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await signup(emailAddress, password, fullName, contactNumber);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#020617]">
      <div
        className="w-full max-w-md p-8 rounded-2xl border"
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(34, 197, 94, 0.2)",
        }}
      >
        <div className="text-center mb-6">
          <Badge
            className="mb-4 px-4 py-1"
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "#22c55e",
            }}
          >
            Get Started
          </Badge>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-2">
            Join shoppers saving with PriceTracker
          </p>
        </div>

        {/* Google OAuth Button */}
        <Button
          type="button"
          onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/users/auth/google`}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 text-lg bg-white text-black hover:bg-gray-100"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#020617] text-gray-400">Or sign up with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={fullName}
            required
            onChange={(e) => setFullName(e.target.value)}
            className="bg-slate-900/60 border-slate-700 text-white"
          />
          <div>
            <Input
              type="tel"
              name="contactNumber"
              placeholder="Contact Number (10-15 characters)"
              value={contactNumber}
              required
              onChange={handleContactNumberChange}
              className={`bg-slate-900/60 border-slate-700 text-white ${
                contactError ? 'border-red-500' : contactNumber && !contactError ? 'border-green-500' : ''
              }`}
            />
            {contactError && (
              <p className="text-red-400 text-xs mt-1">{contactError}</p>
            )}
            {contactNumber && !contactError && (
              <p className="text-green-400 text-xs mt-1">✓ Valid contact number</p>
            )}
          </div>
          <Input
            type="email"
            name="emailAddress"
            placeholder="Email Address"
            value={emailAddress}
            required
            onChange={(e) => setEmailAddress(e.target.value)}
            className="bg-slate-900/60 border-slate-700 text-white"
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-900/60 border-slate-700 text-white"
          />

          {error && (
            <div className="text-red-400 text-sm font-medium">
              {Array.isArray(error) ? (
                error.map((err, index) => <p key={index}>{err}</p>)
              ) : (
                <p>{error}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 text-lg"
            style={{
              background: "linear-gradient(135deg, #22c55e, #a855f7)",
              border: "none",
              boxShadow: "0 6px 20px rgba(34, 197, 94, 0.4)",
            }}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Sign Up
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
