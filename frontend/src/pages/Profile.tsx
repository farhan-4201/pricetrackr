import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User as UserIcon, Mail, Calendar, Clock, Edit, Camera, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: user?.fullName || '',
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setEditForm({
        fullName: user.fullName || '',
      });
      setLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!editForm.fullName.trim()) {
      toast({
        title: "Error",
        description: "Full name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // For now, just show success since the API might not support profile updates yet
      // In a real implementation, this would call an API to update the user profile
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully (demo - API integration pending)",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      fullName: user?.fullName || '',
    });
    setIsEditing(false);
  };

  const getUserInitials = () => {
    if (user?.fullName) {
      const names = user.fullName.split(' ');
      if (names.length >= 2) {
        return names[0].charAt(0).toUpperCase() + names[1].charAt(0).toUpperCase();
      }
      return names[0].charAt(0).toUpperCase();
    }
    if (user?.emailAddress) {
      return user.emailAddress.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >

        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-3 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 leading-tight">
            My Profile
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Manage your account information and preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile Picture Card */}
          <Card className="lg:col-span-1" style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(34, 211, 238, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
          }}>
            <CardContent className="p-6 text-center">
              <div className="relative mb-4">
                <Avatar className="h-32 w-32 mx-auto border-4 border-cyan-400/30">
                  <AvatarImage
                    src={user?.profilePicture ? `/${user.profilePicture}` : undefined}
                    alt={`${user?.fullName || "User"}'s avatar`}
                  />
                  <AvatarFallback
                    className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-2xl font-bold"
                    style={{
                      background: "linear-gradient(135deg, #22d3ee, #3b82f6)",
                      fontSize: "2rem"
                    }}
                  >
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>

                {/* Camera/Edit Icon */}
                <button
                  className="absolute bottom-0 right-1/2 transform translate-x-16 bg-cyan-500 hover:bg-cyan-600 p-2 rounded-full transition-colors duration-200"
                  onClick={() => {
                    toast({
                      title: "Coming soon",
                      description: "Profile picture upload will be available soon",
                    });
                  }}
                >
                  <Camera className="h-4 w-4 text-white" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {user?.fullName || "User"}
              </h3>
              <p className="text-slate-400">Member since {new Date(user?.createdAt || '').toLocaleDateString()}</p>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="lg:col-span-2" style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(34, 211, 238, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
          }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-cyan-400" />
                  Profile Information
                </span>

                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/10"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSave}
                      size="sm"
                      disabled={saving}
                      style={{
                        background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                        border: "none"
                      }}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      className="text-red-400 border-red-400 hover:bg-red-400/10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="fullName"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                    placeholder="Enter your full name"
                    disabled={saving}
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-lg">
                    <UserIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-white">{user?.fullName || "Not set"}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-slate-300">Email Address</Label>
                <div className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-lg">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-white">{user?.emailAddress || "Not set"}</span>
                </div>
                <p className="text-sm text-slate-500">Email address cannot be changed</p>
              </div>

              {/* Account Status */}
              <div className="space-y-2">
                <Label className="text-slate-300">Account Status</Label>
                <div className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${(user?.isActive ?? true) ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-white capitalize">{(user?.isActive ?? true) ? "Active" : "Inactive"}</span>
                </div>
              </div>

              {/* Registration Date */}
              <div className="space-y-2">
                <Label className="text-slate-300">Member Since</Label>
                <div className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-lg">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-white">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : "Not set"}
                  </span>
                </div>
              </div>

              {/* Last Login */}
              <div className="space-y-2">
                <Label className="text-slate-300">Last Login</Label>
                <div className="flex items-center space-x-2 p-3 bg-slate-800/30 rounded-lg">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-white">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : "Not available"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </motion.div>
    </div>
  );
}
