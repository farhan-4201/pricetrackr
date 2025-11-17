"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Mail, RefreshCw } from "lucide-react";
import { authAPI } from "@/lib/api";
import { toast } from "sonner";

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error" | "expired">("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [resending, setResending] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      handleVerification(token);
    } else {
      setVerificationStatus("error");
      setErrorMessage("No verification token provided");
    }
  }, [token]);

  const handleVerification = async (verificationToken: string) => {
    setVerifying(true);

    try {
      const response = await authAPI.verifyEmail(verificationToken);

      if (response.success) {
        setVerificationStatus("success");
        toast.success("Email verified successfully!");
      } else {
        setVerificationStatus("error");
        setErrorMessage(response.message || "Verification failed");
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Verification failed");

      if (err.message.includes("expired")) {
        setVerificationStatus("expired");
        setErrorMessage("This verification link has expired. Please request a new one.");
      } else {
        setVerificationStatus("error");
        setErrorMessage(err.message);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) return;

    setResending(true);

    try {
      await authAPI.resendVerification(userEmail);
      toast.success("New verification email sent!");
      setVerificationStatus("pending");
      setErrorMessage("");
    } catch (error) {
      toast.error("Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  const renderContent = () => {
    if (verifying) {
      return (
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-500" />
          <h2 className="text-2xl font-semibold text-white">Verifying Your Email</h2>
          <p className="text-slate-400">Please wait while we verify your email address...</p>
        </div>
      );
    }

    switch (verificationStatus) {
      case "success":
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-3xl font-bold text-white">Email Verified!</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Your email has been successfully verified. You can now sign in to your PriceTrackr account and start tracking prices.
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <Button
                onClick={() => navigate('/signin')}
                style={{
                  background: "linear-gradient(135deg, #22c55e, #a855f7)",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)",
                }}
              >
                Sign In Now
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Go to Homepage
              </Button>
            </div>
          </div>
        );

      case "expired":
        return (
          <div className="text-center space-y-4">
            <XCircle className="h-16 w-16 text-yellow-500 mx-auto" />
            <h2 className="text-3xl font-bold text-white">Link Expired</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              This verification link has expired. Please request a new verification email to activate your account.
            </p>
            <div className="space-y-4">
              <div className="flex gap-4 justify-center">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                />
                <Button
                  onClick={handleResendVerification}
                  disabled={resending || !userEmail}
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
                  }}
                >
                  {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Resend Email
                </Button>
              </div>
              <div className="text-sm text-slate-400">
                <Link to="/signin" className="text-green-400 hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="text-center space-y-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-3xl font-bold text-white">Verification Failed</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              {errorMessage || "We couldn't verify your email address. The link may be invalid or expired."}
            </p>
            <div className="space-y-4">
              <div className="flex gap-4 justify-center">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                />
                <Button
                  onClick={handleResendVerification}
                  disabled={resending || !userEmail}
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
                  }}
                >
                  {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                  Send New Email
                </Button>
              </div>
              <div className="text-sm text-slate-400 space-x-4">
                <Link to="/signin" className="text-green-400 hover:underline">
                  Back to Sign In
                </Link>
                {" | "}
                <Link to="/" className="text-green-400 hover:underline">
                  Go to Homepage
                </Link>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-4">
            <Mail className="h-16 w-16 text-blue-500 mx-auto" />
            <h2 className="text-3xl font-bold text-white">Check Your Email</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              We've sent you a verification email. Please click the link in the email to verify your account.
            </p>
            <div className="space-y-4">
              <div className="flex gap-4 justify-center">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                />
                <Button
                  onClick={handleResendVerification}
                  disabled={resending || !userEmail}
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
                  }}
                >
                  {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Resend Email
                </Button>
              </div>
              <div className="text-sm text-slate-400">
                <Link to="/signin" className="text-green-400 hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#020617]">
      <Card className="w-full max-w-lg bg-slate-900/60 border-slate-700">
        <CardHeader className="text-center">
          <Badge
            className="mb-4 px-4 py-1 w-fit mx-auto"
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "#22c55e",
            }}
          >
            Email Verification
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
