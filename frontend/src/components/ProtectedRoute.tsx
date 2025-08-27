import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#020617' }}
      >
        <div className="text-center space-y-4">
          {/* Animated Loading Spinner */}
          <div 
            className="w-16 h-16 mx-auto rounded-full border-4 border-transparent animate-spin"
            style={{
              borderTopColor: "#22d3ee",
              borderRightColor: "#22c55e",
              filter: "drop-shadow(0 0 20px rgba(34, 211, 238, 0.5))"
            }}
          />
          <div className="space-y-2">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
              Authenticating
            </h3>
            <p className="text-slate-400">Please wait while we verify your session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show signin prompt if not authenticated
  if (!user) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: '#020617' }}
      >
        <div 
          className="max-w-md w-full p-8 rounded-xl border text-center space-y-6"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(34, 211, 238, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
          }}
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
              Authentication Required
            </h2>
            <p className="text-slate-400">
              Please sign in to access this feature
            </p>
          </div>
          
          <div className="space-y-3">
            <a
              href="/signin"
              className="block w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                color: "white",
                textDecoration: "none",
                boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)"
              }}
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="block w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 text-cyan-400 hover:text-white"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(34, 211, 238, 0.2)",
                textDecoration: "none"
              }}
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
};