
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
            Join 500K+ shoppers saving with PriceTracker
          </p>
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
