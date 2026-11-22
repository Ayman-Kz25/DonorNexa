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

  const containerRef = useRef(null);
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

  // Fetch notifications on mount and periodically refresh them.
  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside or pressing Escape.
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

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
    <div ref={containerRef} className="relative">
      {/* Notification Bell */}
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] text-[#782B40] shadow-sm transition hover:bg-[#F2E2DC] sm:h-10 sm:w-10 sm:rounded-xl"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell size={20} className="sm:h-[21px] sm:w-[21px]" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#963D54] px-1 text-[9px] font-bold text-white ring-2 ring-[#FFFDF9] sm:text-[10px]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed left-3 right-3 top-[4.5rem] z-[100] mx-auto w-auto max-w-[420px] overflow-hidden rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] shadow-[0_12px_40px_rgba(80,45,45,0.16)] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:mx-0 sm:w-[min(380px,calc(100vw-32px))] md:w-[400px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-[#E8DDD4] px-3 py-3 sm:px-4 sm:py-3.5">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#302923] sm:text-base">
                Notifications
              </h3>

              <p className="mt-0.5 text-[11px] text-[#81756A] sm:text-xs">
                {unreadCount} unread notification
                {unreadCount !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  aria-label="Mark all notifications as read"
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
          <div className="max-h-[min(65dvh,420px)] overflow-y-auto overscroll-contain sm:max-h-[420px]">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs text-[#81756A] sm:text-sm">
                <LoaderCircle size={18} className="shrink-0 animate-spin" />
                Loading notifications...
              </div>
            ) : error ? (
              <div className="px-4 py-9 text-center sm:px-5 sm:py-10">
                <p className="text-xs text-[#963D54] sm:text-sm">{error}</p>

                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="mt-3 text-xs font-semibold text-[#782B40] hover:underline sm:text-sm"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-9 text-center sm:px-5 sm:py-10">
                <Bell size={28} className="mx-auto mb-3 text-[#C7A9A0]" />

                <p className="text-xs font-medium text-[#302923] sm:text-sm">
                  No notifications yet
                </p>

                <p className="mt-1 text-[11px] text-[#81756A] sm:text-xs">
                  Updates and alerts will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`border-b border-[#E8DDD4]/70 px-3 py-3 transition last:border-b-0 sm:px-4 sm:py-3.5 ${
                    notification.isRead ? "bg-[#FFFDF9]" : "bg-[#F9EFEC]"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                    <div
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5 ${
                        notification.isRead ? "bg-[#D8C9C0]" : "bg-[#963D54]"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-xs font-semibold leading-5 text-[#302923] sm:text-sm">
                        {notification.title}
                      </p>

                      <p className="mt-1 break-words text-[11px] leading-relaxed text-[#6F6258] sm:text-xs">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-[10px] text-[#A09286] sm:text-[11px]">
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
