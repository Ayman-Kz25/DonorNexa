import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, LoaderCircle, X } from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { formatDateTime } from "../../utils/dateTime";
import socket from "../../lib/socket";

function NotificationBell() {
  const { request } = useApi();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const notificationIds = useRef(new Set());
  const realtimeNotifications = useRef([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await request({
        method: "GET",
        url: "/api/notifications",
      });

      const fetchedNotifications = response.data.notifications || [];
      const fetchedIds = new Set(
        fetchedNotifications.map((notification) => notification._id),
      );

      // Preserve notifications received while the API request was running.
      const newRealtimeNotifications = realtimeNotifications.current.filter(
        (notification) => !fetchedIds.has(notification._id),
      );

      const mergedNotifications = [
        ...newRealtimeNotifications,
        ...fetchedNotifications,
      ].slice(0, 30);

      notificationIds.current = new Set(
        mergedNotifications.map((notification) => notification._id),
      );

      setNotifications(mergedNotifications);

      const additionalUnread = newRealtimeNotifications.filter(
        (notification) => !notification.isRead,
      ).length;

      setUnreadCount((response.data.unreadCount || 0) + additionalUnread);

      setError("");
    } catch (err) {
      console.error("Fetch notifications error:", err);
      setError("Unable to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  // Fetch existing notifications when the component mounts.
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for new notifications through Socket.IO.
  useEffect(() => {
    const handleNewNotification = (notification) => {
      if (notificationIds.current.has(notification._id)) {
        return;
      }

      notificationIds.current.add(notification._id);
      realtimeNotifications.current.unshift(notification);

      setNotifications((previous) => [notification, ...previous].slice(0, 30));

      if (!notification.isRead) {
        setUnreadCount((previous) => previous + 1);
      }
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await request({
        method: "PATCH",
        url: `/api/notifications/${notificationId}/read`,
      });

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );

      realtimeNotifications.current = realtimeNotifications.current.map(
        (notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification,
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (err) {
      console.error("Mark notification as read error:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await request({
        method: "PATCH",
        url: "/api/notifications/read-all",
      });

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      realtimeNotifications.current = realtimeNotifications.current.map(
        (notification) => ({
          ...notification,
          isRead: true,
        }),
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all notifications as read error:", err);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] text-[#782B40] shadow-sm transition hover:bg-[#F2E2DC]"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
      >
        <Bell size={21} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#963D54] px-1 text-[10px] font-bold text-white ring-2 ring-[#FFFDF9]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-[100] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] shadow-[0_12px_40px_rgba(80,45,45,0.16)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E8DDD4] px-4 py-3.5">
            <div>
              <h3 className="font-semibold text-[#302923]">Notifications</h3>
              <p className="text-xs text-[#81756A]">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="rounded-lg p-2 text-[#963D54] transition hover:bg-[#F2E2DC]"
                >
                  <CheckCheck size={18} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
                className="rounded-lg p-2 text-[#81756A] transition hover:bg-[#F0EAE0]"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#81756A]">
                <LoaderCircle size={18} className="animate-spin" />
                Loading notifications...
              </div>
            ) : error ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-[#963D54]">{error}</p>
                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="mt-3 text-sm font-semibold text-[#782B40] hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Bell size={30} className="mx-auto mb-3 text-[#C7A9A0]" />
                <p className="text-sm font-medium text-[#302923]">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-[#81756A]">
                  Updates and alerts will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`border-b border-[#E8DDD4]/70 px-4 py-3.5 transition last:border-b-0 ${
                    notification.isRead ? "bg-[#FFFDF9]" : "bg-[#F9EFEC]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        notification.isRead ? "bg-[#D8C9C0]" : "bg-[#963D54]"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#302923]">
                        {notification.title}
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-[#6F6258]">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-[10px] text-[#A09286]">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>

                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification._id)}
                        title="Mark as read"
                        aria-label="Mark notification as read"
                        className="shrink-0 rounded-lg p-1.5 text-[#963D54] transition hover:bg-[#F2E2DC]"
                      >
                        <Check size={17} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
