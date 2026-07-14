import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import StaffLimitSidebar from "./StaffLimitSidebar";
import {
  notificationService,
  type NotificationItem,
  type NotificationResponse,
  type NotificationType,
} from "../../services/notification.service";
import "./StaffLimitLayout.css";

const NOTIFICATION_POLLING_TIME = 30000;

const getNotificationIcon = (type: NotificationType) => {
  const map: Record<NotificationType, string> = {
    don_hang: "🛒",
    thanh_toan: "💳",
    giao_hang: "🚚",
    ao_nuoi: "🌱",
    cong_no: "💰",
    ho_so: "📋",
    kho_hang: "📦",
    he_thong: "🔔",
  };

  return map[type] || "🔔";
};

const formatUnreadCount = (count: number) => {
  if (!count) return "";
  return count > 99 ? "99+" : String(count);
};

const formatNotificationTime = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN");
};

const getStoredUserName = () => {
  try {
    const rawUser =
      localStorage.getItem("user") ||
      localStorage.getItem("currentUser") ||
      localStorage.getItem("authUser");

    if (!rawUser) return "Nhân viên định mức";

    const user = JSON.parse(rawUser);
    return user?.ho_ten || user?.name || user?.email || "Nhân viên định mức";
  } catch {
    return "Nhân viên định mức";
  }
};

export default function StaffLimitLayout() {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const userName = useMemo(() => getStoredUserName(), []);
  const userInitial = useMemo(() => {
    const trimmedName = userName.trim();
    return trimmedName ? trimmedName.charAt(0).toUpperCase() : "Đ";
  }, [userName]);

  const loadNotifications = async (silent = false) => {
    try {
      if (!silent) setLoadingNotifications(true);

      const data: NotificationResponse =
        await notificationService.getMyNotifications();

      setUnreadCount(Number(data.unreadCount || 0));
      setNotifications((data.notifications || []).slice(0, 8));
    } catch (error) {
      console.error("LOAD_STAFF_NOTIFICATIONS_ERROR:", error);
    } finally {
      if (!silent) setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const timer = window.setInterval(() => {
      loadNotifications(true);
    }, NOTIFICATION_POLLING_TIME);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);

    if (!isDropdownOpen) {
      loadNotifications(true);
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      if (!notification.da_doc) {
        await notificationService.markAsRead(notification.id_thong_bao);
      }

      await loadNotifications(true);
      setIsDropdownOpen(false);

      if (notification.lien_ket) {
        navigate(notification.lien_ket);
      }
    } catch (error) {
      console.error("READ_NOTIFICATION_ERROR:", error);
    }
  };

  const handleMarkAllAsRead = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    try {
      await notificationService.markAllAsRead();
      await loadNotifications(true);
    } catch (error) {
      console.error("READ_ALL_NOTIFICATION_ERROR:", error);
    }
  };

  const handleViewAll = () => {
    setIsDropdownOpen(false);
    navigate("/nhan-vien-dinh-muc/thong-bao");
  };

  return (
    <div className="staff-limit-shell">
      <StaffLimitSidebar unreadCount={unreadCount} />

      <div className="staff-limit-workspace">
        <header className="staff-limit-header">
          <div className="staff-limit-header__title">
            <span>Hệ thống thẩm định hạn mức</span>
            <strong>Nhân viên định mức</strong>
          </div>

          <div className="staff-limit-header__actions">
            <div className="staff-limit-notification" ref={dropdownRef}>
              <button
                type="button"
                className={
                  unreadCount > 0
                    ? "staff-limit-notification__bell has-unread"
                    : "staff-limit-notification__bell"
                }
                onClick={handleToggleDropdown}
                aria-label="Thông báo"
              >
                <span>🔔</span>
                {unreadCount > 0 && (
                  <em>{formatUnreadCount(unreadCount)}</em>
                )}
              </button>

              {isDropdownOpen && (
                <div className="staff-limit-notification__dropdown">
                  <div className="staff-limit-notification__head">
                    <div>
                      <strong>Thông báo</strong>
                      <span>{unreadCount} chưa đọc</span>
                    </div>

                    {unreadCount > 0 && (
                      <button type="button" onClick={handleMarkAllAsRead}>
                        Đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="staff-limit-notification__list">
                    {loadingNotifications ? (
                      <div className="staff-limit-notification__empty">
                        Đang tải thông báo...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="staff-limit-notification__empty">
                        Chưa có thông báo nào.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <button
                          type="button"
                          key={item.id_thong_bao}
                          className={
                            item.da_doc
                              ? "staff-limit-notification__item"
                              : "staff-limit-notification__item unread"
                          }
                          onClick={() => handleNotificationClick(item)}
                        >
                          <span className="staff-limit-notification__icon">
                            {getNotificationIcon(item.loai)}
                          </span>

                          <span className="staff-limit-notification__content">
                            <strong>{item.tieu_de}</strong>
                            <small>{item.noi_dung}</small>
                            <em>{formatNotificationTime(item.ngay_tao)}</em>
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    className="staff-limit-notification__view-all"
                    onClick={handleViewAll}
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              )}
            </div>

            <div className="staff-limit-user">
              <div className="staff-limit-user__avatar">{userInitial}</div>
              <div>
                <span>{userName}</span>
                <strong>Nhân viên định mức</strong>
              </div>
            </div>
          </div>
        </header>

        <main className="staff-limit-main">
          <div className="staff-limit-main__inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
