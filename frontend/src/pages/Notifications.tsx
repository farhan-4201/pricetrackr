import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Eye, Trash2, Check, Filter, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { notificationsAPI } from "@/lib/api";

interface Product {
  _id: string;
  name: string;
}

interface Notification {
  _id: string;
  type: 'price_alert' | 'price_drop' | 'account' | 'system' | 'watchlist';
  title: string;
  message: string;
  productId: Product | null;
  isRead: boolean;
  createdAt: string;
}

export default function Notifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'price_alert', label: 'Price Alerts' },
    { value: 'price_drop', label: 'Price Drops' },
    { value: 'watchlist', label: 'Watchlist' },
    { value: 'account', label: 'Account' },
    { value: 'system', label: 'System' },
  ];

  const fetchNotifications = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      const params: { isRead?: boolean } = {};
      if (filter === 'unread') params.isRead = false;
      if (filter === 'read') params.isRead = true;

      const data = await notificationsAPI.getNotifications(params);
      setNotifications(data as Notification[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      toast({
        title: "Marked as read",
        description: "Notification has been marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      toast({
        title: "Marked all as read",
        description: "All notifications have been marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notification => notification._id !== notificationId));
      toast({
        title: "Deleted",
        description: "Notification has been deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'price_alert':
        return 'text-blue-400 border-blue-400/30';
      case 'price_drop':
        return 'text-green-400 border-green-400/30';
      case 'account':
        return 'text-purple-400 border-purple-400/30';
      case 'system':
        return 'text-orange-400 border-orange-400/30';
      case 'watchlist':
        return 'text-yellow-400 border-yellow-400/30';
      default:
        return 'text-cyan-400 border-cyan-400/30';
    }
  };

  const getTypeIcon = (type: string) => {
    return <Bell className={`w-4 h-4 ${getTypeColor(type)}`} />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInDays < 1) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && !notification.isRead) ||
      (filter === 'read' && notification.isRead);

    const matchesType = typeFilter === 'all' || notification.type === typeFilter;

    const matchesSearch = searchQuery === '' ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesType && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >

        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-cyan-400 mr-3" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                  Notifications
                </h1>
                <p className="text-slate-400 text-sm md:text-base mt-1">
                  Stay updated with price changes and important alerts
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`px-3 py-1 ${unreadCount > 0 ? 'text-red-400 border-red-400' : 'text-cyan-400 border-cyan-400'}`}
            >
              {unreadCount} unread
            </Badge>
          </div>
        </motion.div>

        {/* Filters and Actions */}
        <Card className="mb-6" style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(34, 211, 238, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
        }}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>

                {/* Read Filter */}
                <Select value={filter} onValueChange={(value: string) => setFilter(value as 'all' | 'unread' | 'read')}>
                  <SelectTrigger className="w-32 bg-slate-800/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40 bg-slate-800/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                {/* Refresh */}
                <Button
                  onClick={() => fetchNotifications(false)}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/10"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                {/* Mark All as Read */}
                {unreadCount > 0 && (
                  <Button
                    onClick={handleMarkAllAsRead}
                    variant="outline"
                    size="sm"
                    className="text-green-400 border-green-400 hover:bg-green-400/10"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark All Read
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(34, 211, 238, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
          }}>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bell className="h-16 w-16 text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">
                {notifications.length === 0 ? "No notifications yet" : "No notifications match your filters"}
              </h3>
              <p className="text-slate-500 text-center max-w-sm">
                {notifications.length === 0
                  ? "You'll receive notifications about price changes and important updates here."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {notifications.length === 0 && (
                <Button
                  className="mt-4"
                  onClick={() => window.location.href = '/dashboard'}
                  style={{
                    background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                    border: "none"
                  }}
                >
                  Start Shopping
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification._id}
                style={{
                  background: notification.isRead ? "rgba(255, 255, 255, 0.02)" : "rgba(34, 211, 238, 0.05)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: notification.isRead ? "1px solid rgba(34, 211, 238, 0.05)" : "1px solid rgba(34, 211, 238, 0.2)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Type Icon */}
                      <div className={`p-2 rounded-lg border ${getTypeColor(notification.type)} bg-slate-800/30`}>
                        {getTypeIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-white mb-2">
                              {notification.title}
                            </h3>
                            <p className="text-slate-300 mb-3 leading-relaxed">
                              {notification.message}
                            </p>
                            {notification.productId && (
                              <p className="text-xs text-cyan-400 mb-2 font-medium">
                                Related Product: {notification.productId.name}
                              </p>
                            )}
                            <p className="text-xs text-slate-500">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 mt-4">
                          {!notification.isRead && (
                            <Button
                              onClick={() => handleMarkAsRead(notification._id)}
                              variant="outline"
                              size="sm"
                              className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/10"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Mark Read
                            </Button>
                          )}

                          <Button
                            onClick={() => handleDelete(notification._id)}
                            variant="outline"
                            size="sm"
                            className="text-red-400 border-red-400 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div className="w-3 h-3 bg-cyan-400 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
