"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus } from "lucide-react";

export default function SignUp() {
  const { signup, error, clearError, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await signup(email, password, name);
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
            placeholder="Name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-900/60 border-slate-700 text-white"
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-900/60 border-slate-700 text-white"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-900/60 border-slate-700 text-white"
          />

          {error && (
            <p className="text-red-400 text-sm font-medium">{error}</p>
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
