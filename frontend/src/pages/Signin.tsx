"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogIn } from "lucide-react";

export default function SignIn() {
  const { signin, error, clearError, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const result = await signin(emailAddress, password);
    if (result.success) {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#020617]">
      <div
        className="w-full max-w-md p-8 rounded-2xl border"
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(34, 211, 238, 0.2)",
        }}
      >
        <div className="text-center mb-6">
          <Badge
            className="mb-4 px-4 py-1"
            style={{
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.3)",
              color: "#22d3ee",
            }}
          >
            Welcome Back
          </Badge>
          <h1 className="text-3xl font-bold text-white">Sign In</h1>
          <p className="text-slate-400 mt-2">Access your PriceTracker account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              background: "linear-gradient(135deg, #22d3ee, #22c55e)",
              border: "none",
              boxShadow: "0 6px 20px rgba(34, 211, 238, 0.4)",
            }}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Sign In
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
