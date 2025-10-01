import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, BellOff, Check, Trash2, Eye } from "lucide-react";

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

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (notificationId: string) => void;
  className?: string;
}

export const NotificationCenter = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  className
}: NotificationCenterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'price_alert':
        return 'text-blue-400';
      case 'price_drop':
        return 'text-green-400';
      case 'account':
        return 'text-purple-400';
      case 'system':
        return 'text-orange-400';
      case 'watchlist':
        return 'text-yellow-400';
      default:
        return 'text-cyan-400';
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
      return `${diffInMinutes}min ago`;
    } else if (diffInDays < 1) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`relative text-cyan-400 border-cyan-400 hover:bg-cyan-400/10 ${className}`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 bg-red-500 text-white border-none px-1.5 py-0.5 text-xs min-w-5 h-5 flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md max-h-[600px] flex flex-col">
        <DialogHeader className="flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </DialogTitle>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/10"
            >
              <Check className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </DialogHeader>

        {notifications.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="text-center">
              <Bell className="w-12 h-12 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No notifications yet</p>
              <p className="text-slate-500 text-sm">We'll notify you when prices change</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.isRead
                      ? 'bg-slate-800/50 border-slate-700'
                      : 'bg-cyan-950/20 border-cyan-400/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm leading-tight">
                          {notification.title}
                        </h4>
                        <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        {notification.productId && (
                          <p className="text-xs text-cyan-400 mt-1">
                            Product: {notification.productId.name}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarkAsRead(notification._id)}
                          className="h-8 w-8 p-0 hover:bg-cyan-400/10"
                          title="Mark as read"
                        >
                          <Eye className="w-3 h-3 text-cyan-400" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(notification._id)}
                        className="h-8 w-8 p-0 hover:bg-red-400/10"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
