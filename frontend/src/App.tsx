import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { initGlobalScrollReveal } from "./hooks/useScrollReveal";
import { PageLoadingFallback } from "@/components/LoadingFallback";

// Lazy load components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Features = lazy(() => import("./pages/Features").then(module => ({ default: module.Features })));
const About = lazy(() => import("./pages/About").then(module => ({ default: module.About })));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Signup = lazy(() => import("./pages/Signup"));
const Signin = lazy(() => import("./pages/Signin"));
const GoogleAuth = lazy(() => import("./pages/GoogleAuth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));

const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Component to initialize scroll reveal
const ScrollRevealProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Initialize global scroll reveal with a slight delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initGlobalScrollReveal();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <ScrollRevealProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Layout>
                <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />

                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/watchlist"
                      element={
                        <ProtectedRoute>
                          <WatchlistPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/notifications"
                      element={
                        <ProtectedRoute>
                          <Notifications />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/signup" element={<Signin />} />
                    <Route path="/signin" element={<Signin />} />
                    <Route path="/auth/google" element={<GoogleAuth />} />

                    {/* Footer Pages */}
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/cookie-policy" element={<CookiePolicy />} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </Layout>
            </BrowserRouter>
          </ScrollRevealProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
