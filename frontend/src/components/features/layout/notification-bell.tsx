import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchNotificationsRequest, markAllNotificationsReadRequest } from "../../../services/notification-api";
import { notify } from "../../../lib/notify";
import type { NotificationItem } from "../../../types/notification";
import type { UserRole } from "../../../types/auth";

interface NotificationBellProps {
  role: UserRole | null;
}

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

export const NotificationBell = ({ role }: NotificationBellProps) => {
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const canUseNotifications = role === "admin" || role === "manager";

  const loadNotifications = async (options?: { silent?: boolean }) => {
    if (!canUseNotifications) {
      return;
    }

    if (!options?.silent) {
      setIsLoading(true);
    }

    try {
      const result = await fetchNotificationsRequest();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (error: unknown) {
      if (!options?.silent) {
        notify.error(error instanceof Error ? error.message : "Unable to load notifications");
      }
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadNotifications({ silent: true });
    if (!canUseNotifications) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadNotifications({ silent: true });
    }, 30000);

    return () => window.clearInterval(interval);
  }, [canUseNotifications]);

  if (!canUseNotifications) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#4318FF] shadow-[0_12px_30px_rgba(11,20,55,0.08)] transition hover:bg-[#F8FAFF]"
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);
          if (nextOpen) {
            void loadNotifications();
          }
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h11Z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-14 z-40 w-[min(24rem,calc(100vw-2rem))] rounded-[1.5rem] bg-white p-4 shadow-[0_24px_80px_rgba(11,20,55,0.18)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#2B3674]">Notifications</p>
              <p className="text-xs text-[#A3AED0]">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-[#4318FF]"
              disabled={isMarkingRead || unreadCount === 0}
              onClick={() => {
                void (async () => {
                  setIsMarkingRead(true);

                  try {
                    const result = await markAllNotificationsReadRequest();
                    setNotifications(result.notifications);
                    setUnreadCount(result.unreadCount);
                  } catch (error: unknown) {
                    notify.error(error instanceof Error ? error.message : "Unable to update notifications");
                  } finally {
                    setIsMarkingRead(false);
                  }
                })();
              }}
            >
              Mark all read
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="rounded-2xl bg-[#F8FAFF] p-4 text-sm text-[#707EAE]">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FAFF] p-4 text-sm text-[#707EAE]">No invoice notifications yet.</div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={`${notification.link}${notification.link.includes("?") ? "&" : "?"}notification=${notification.id}`}
                  className={`block rounded-2xl border px-4 py-3 transition hover:border-[#D9E1F2] hover:bg-[#F8FAFF] ${
                    notification.readAt ? "border-[#EEF2FF] bg-white" : "border-[#DCE6FF] bg-[#F8FAFF]"
                  }`}
                  onClick={() => {
                    if (location.pathname === notification.link) {
                      void loadNotifications({ silent: true });
                    }
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-[#2B3674]">{notification.title}</p>
                    {!notification.readAt ? (
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#4318FF]" />
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#707EAE]">{notification.message}</p>
                  <p className="mt-3 text-xs font-medium text-[#A3AED0]">{formatTimestamp(notification.createdAt)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
