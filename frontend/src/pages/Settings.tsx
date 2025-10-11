import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Bell, BellOff, Mail, MessageSquare, Shield, Save, Moon, Sun, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authenticatedApiClient } from "@/lib/api";

export default function Settings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    priceAlerts: true,
    productUpdates: true,
    darkMode: true,
    emailMarketing: false,
    dataCollection: true,
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await authenticatedApiClient.get('/users/settings');
      if (response) {
        setSettings(response as typeof settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use default settings if loading fails
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authenticatedApiClient.put('/users/settings', settings);
      toast({
        title: "✅ Settings saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (error) {
      console.error('Save settings error:', error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

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
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-3 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 leading-tight">
            Settings
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Customize your experience and manage your preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Quick Actions */}
          <Card className="lg:col-span-1" style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(34, 211, 238, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
          }}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-cyan-400" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full text-cyan-400 border-cyan-400 hover:bg-cyan-400/10"
                onClick={() => toast({ title: "Coming soon", description: "Password change will be available soon" })}
              >
                Change Password
              </Button>

              <Button
                variant="outline"
                className="w-full text-cyan-400 border-cyan-400 hover:bg-cyan-400/10"
                onClick={() => toast({ title: "Coming soon", description: "Two-factor authentication setup will be available soon" })}
              >
                Enable 2FA
              </Button>

              <Button
                variant="outline"
                className="w-full text-red-400 border-red-400 hover:bg-red-400/10"
                onClick={() => toast({ title: "Coming soon", description: "Account deletion will be available soon" })}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
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
                  <SettingsIcon className="h-5 w-5 mr-2 text-cyan-400" />
                  Preferences
                </span>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                    border: "none"
                  }}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-8">

              {/* Notification Settings */}
              <div className="space-y-6">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                </div>

                <div className="space-y-4 ml-7">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <div>
                        <Label className="text-white text-sm font-medium">Email Notifications</Label>
                        <p className="text-xs text-slate-500">Receive notifications via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>

                  {/* SMS Notifications */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-4 w-4 text-slate-400" />
                      <div>
                        <Label className="text-white text-sm font-medium">SMS Notifications</Label>
                        <p className="text-xs text-slate-500">Receive notifications via text message</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                    />
                  </div>

                  {/* Price Alerts */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-4 w-4 text-slate-400" />
                      <div>
                        <Label className="text-white text-sm font-medium">Price Alerts</Label>
                        <p className="text-xs text-slate-500">Get notified when prices drop</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.priceAlerts}
                      onCheckedChange={(checked) => handleSettingChange('priceAlerts', checked)}
                    />
                  </div>

                  {/* Product Updates */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <BellOff className="h-4 w-4 text-slate-400" />
                      <div>
                        <Label className="text-white text-sm font-medium">Product Updates</Label>
                        <p className="text-xs text-slate-500">Receive updates about products in your watchlist</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.productUpdates}
                      onCheckedChange={(checked) => handleSettingChange('productUpdates', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-6">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Privacy & Data</h3>
                </div>

                <div className="space-y-4 ml-7">
                  {/* Data Collection */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <Label className="text-white text-sm font-medium">Analytics & Data Collection</Label>
                      <p className="text-xs text-slate-500">Help improve our service by allowing data collection</p>
                    </div>
                    <Switch
                      checked={settings.dataCollection}
                      onCheckedChange={(checked) => handleSettingChange('dataCollection', checked)}
                    />
                  </div>

                  {/* Email Marketing */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <Label className="text-white text-sm font-medium">Marketing Emails</Label>
                      <p className="text-xs text-slate-500">Receive promotional emails and special offers</p>
                    </div>
                    <Switch
                      checked={settings.emailMarketing}
                      onCheckedChange={(checked) => handleSettingChange('emailMarketing', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="space-y-6">
                <div className="flex items-center">
                  {settings.darkMode ? <Moon className="h-5 w-5 mr-2 text-cyan-400" /> : <Sun className="h-5 w-5 mr-2 text-cyan-400" />}
                  <h3 className="text-lg font-semibold text-white">Appearance</h3>
                </div>

                <div className="space-y-4 ml-7">
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {settings.darkMode ? <Moon className="h-4 w-4 text-slate-400" /> : <Sun className="h-4 w-4 text-slate-400" />}
                      <div>
                        <Label className="text-white text-sm font-medium">Dark Mode</Label>
                        <p className="text-xs text-slate-500">Use dark theme for the interface</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.darkMode}
                      onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                    />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
