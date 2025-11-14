import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart,
  Menu,
  Bell,
  User,
  LogOut,
  X,
  Settings,
  Heart,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { NotificationDropdown } from "@/components/NotificationDropdown";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, signout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/features", label: "Features" },
    { to: "/about", label: "About" },
    { to: "/how-it-works", label: "How It Works?" },
  ];

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // Debug logging
  console.log("Navbar - User:", user);
  console.log("Navbar - isAuthenticated:", isAuthenticated);
  console.log("Navbar - profilePicture:", user?.profilePicture);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (user?.fullName) {
      const names = user.fullName.split(" ");
      if (names.length >= 2) {
        return (
          names[0].charAt(0).toUpperCase() + names[1].charAt(0).toUpperCase()
        );
      }
      return names[0].charAt(0).toUpperCase();
    }
    if (user?.emailAddress) {
      return user.emailAddress.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <>
      {/* Glassmorphic Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-6 md:py-4"
        style={{
          background: "rgba(2, 6, 23, 0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(34, 211, 238, 0.1)",
        }}
      >
        <div className="w-full flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 group cursor-pointer"
          >
            <div
              className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110 logo-pulse"
              style={{
                background: "rgba(34, 211, 238, 0.1)",
                boxShadow: "0 0 20px rgba(34, 211, 238, 0.3)",
              }}
            >
              <BarChart
                className="h-6 w-6 transition-colors duration-300"
                style={{ color: "#22d3ee" }}
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              PriceTracker
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`relative px-4 py-2 rounded-lg transition-all duration-300 group focus-enhanced touch-target ${
                    isActive
                      ? "text-cyan-400 bg-[rgba(34,211,238,0.1)] glowing-border"
                      : "text-slate-300 hover:text-cyan-400 hover:bg-[rgba(34,211,238,0.05)]"
                  }`}
                >
                  {link.label}
                  <div
                    className={`absolute bottom-0 left-1/2 h-0.5 bg-gradient-to-r from-cyan-400 to-green-400 transition-all duration-300 -translate-x-1/2 ${
                      isActive ? "w-3/4" : "w-0 group-hover:w-3/4"
                    }`}
                  />
                </NavLink>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-300 hover:scale-110 touch-target"
              style={{
                background: "rgba(34, 211, 238, 0.1)",
                border: "1px solid rgba(34, 211, 238, 0.2)",
                color: "#22d3ee",
              }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Show authenticated UI if user is authenticated */}
            {isAuthenticated && user ? (
              <>
                {/* Notifications */}
                <NotificationDropdown />

                {/* User Avatar with Dropdown - Force show even without user object */}
                <DropdownMenu
                  open={dropdownOpen}
                  onOpenChange={setDropdownOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-cyan-400/30 transition-all duration-300 hover:scale-110 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 group"
                      aria-label="Open user menu"
                    >
                      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 glowing-border" />
                      <Avatar className="h-full w-full">
                        <AvatarImage
                          src={
                            user?.profilePicture
                              ? `/${user.profilePicture}`
                              : undefined
                          }
                          alt={`${user?.fullName || "User"}'s avatar`}
                          onError={(e) => {
                            console.log(
                              "Avatar image failed to load:",
                              user?.profilePicture
                            );
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <AvatarFallback
                          className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-semibold border-0"
                          style={{
                            background:
                              "linear-gradient(135deg, #22d3ee, #3b82f6)",
                          }}
                        >
                          {user?.fullName ? getUserInitials() : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-60 sm:w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 text-white shadow-2xl"
                    style={{
                      background: "rgba(15, 23, 42, 0.95)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      boxShadow:
                        "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <DropdownMenuLabel className="font-normal p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={
                              user?.profilePicture
                                ? `/${user.profilePicture}`
                                : undefined
                            }
                            alt={`${user?.fullName || "User"}'s avatar`}
                          />
                          <AvatarFallback
                            className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold"
                            style={{
                              background:
                                "linear-gradient(135deg, #22d3ee, #3b82f6)",
                            }}
                          >
                            {user?.fullName ? getUserInitials() : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none text-white">
                            {user?.fullName || "User"}
                          </p>
                          <p className="text-xs leading-none text-slate-400">
                            {user?.emailAddress || "user@example.com"}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-slate-700/50" />

                    <DropdownMenuItem
                      className="hover:bg-slate-800/50 text-slate-200 focus:bg-slate-800/50 cursor-pointer p-3 transition-colors"
                      asChild
                    >
                      <Link to="/profile" className="flex items-center">
                        <User className="mr-3 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="hover:bg-slate-800/50 text-slate-200 focus:bg-slate-800/50 cursor-pointer p-3 transition-colors"
                      asChild
                    >
                      <Link to="/settings" className="flex items-center">
                        <Settings className="mr-3 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="hover:bg-slate-800/50 text-slate-200 focus:bg-slate-800/50 cursor-pointer p-3 transition-colors"
                      asChild
                    >
                      <Link to="/notifications" className="flex items-center">
                        <Bell className="mr-3 h-4 w-4" />
                        Notifications
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="hover:bg-slate-800/50 text-slate-200 focus:bg-slate-800/50 cursor-pointer p-3 transition-colors"
                      asChild
                    >
                      <Link to="/watchlist" className="flex items-center">
                        <Heart className="mr-3 h-4 w-4" />
                        Watchlist
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-700/50" />

                    <DropdownMenuItem
                      className="hover:bg-red-900/30 text-red-400 focus:bg-red-900/30 focus:text-red-400 cursor-pointer p-3 transition-colors"
                      onClick={async () => {
                        try {
                          await signout();
                          setDropdownOpen(false);
                        } catch (error) {
                          console.error("Signout error:", error);
                        }
                      }}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <Button
                    className="relative overflow-hidden font-medium transition-all duration-300 hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                      boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)",
                    }}
                  >
                    <span className="relative z-10">Get Started</span>
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-cyan-400 transition-all duration-300"
            style={{ background: "rgba(255, 255, 255, 0.05)" }}
            aria-label="Toggle mobile menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-[rgba(2,6,23,0.95)] backdrop-blur-xl"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="pt-20 px-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-6 py-4 rounded-xl text-lg font-medium transition-all duration-300 ${
                    isActive
                      ? "text-cyan-400 bg-[rgba(34,211,238,0.1)]"
                      : "text-slate-300 bg-[rgba(255,255,255,0.05)]"
                  }`}
                >
                  {link.label}
                </NavLink>
              );
            })}

            {isAuthenticated && user ? (
              <>
                {/* User Info */}
                <div className="px-6 py-4 rounded-xl bg-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={
                          user?.profilePicture
                            ? `/${user.profilePicture}`
                            : undefined
                        }
                        alt={`${user?.fullName || "User"}'s avatar`}
                      />
                      <AvatarFallback
                        className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold"
                        style={{
                          background:
                            "linear-gradient(135deg, #22d3ee, #3b82f6)",
                        }}
                      >
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-white font-medium text-sm">
                        {user?.fullName || "User"}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {user?.emailAddress}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Menu Items */}
                <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full text-slate-300 hover:text-cyan-400 py-3 text-lg justify-start"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(34, 211, 238, 0.2)",
                    }}
                  >
                    <User className="mr-3 h-5 w-5" />
                    Profile
                  </Button>
                </Link>

                <Link to="/settings" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full text-slate-300 hover:text-cyan-400 py-3 text-lg justify-start"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(34, 211, 238, 0.2)",
                    }}
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                  </Button>
                </Link>

                <Link to="/watchlist" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full text-slate-300 hover:text-cyan-400 py-3 text-lg justify-start"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(34, 211, 238, 0.2)",
                    }}
                  >
                    <Heart className="mr-3 h-5 w-5" />
                    Watchlist
                  </Button>
                </Link>

                {/* Logout Button */}
                <Button
                  variant="ghost"
                  className="w-full text-red-400 hover:text-red-300 py-3 text-lg justify-start"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                  onClick={async () => {
                    try {
                      await signout();
                      setIsMenuOpen(false);
                    } catch (error) {
                      console.error("Signout error:", error);
                    }
                  }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/signin" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    className="w-full py-3 text-lg font-medium"
                    style={{
                      background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                      boxShadow: "0 4px 20px rgba(34, 211, 238, 0.4)",
                    }}
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
