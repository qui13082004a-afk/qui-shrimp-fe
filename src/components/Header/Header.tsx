import { useState, useEffect, useRef } from "react";
import { Bell, ShoppingCart, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { notificationService, type NotificationItem } from "../../services/notification.service";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  const getRoleName = () => {
    switch (user?.vai_tro) {
      case "admin":
        return "QUẢN TRỊ VIÊN";
      case "nhan_vien_giao_hang":
        return "NHÂN VIÊN GIAO HÀNG";
      default:
        return "CHỦ TRANG TRẠI";
    }
  };

  const getNotifyIcon = (type: string) => {
    switch (type) {
      case "don_hang":
        return "📦";
      case "thanh_toan":
        return "💰";
      case "giao_hang":
        return "🚚";
      case "ao_nuoi":
        return "🦐";
      default:
        return "🔔";
    }
  };

  const formatTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;

    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const handleOpenNotifications = async () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) await fetchNotifications();
  };

  /* =========================================================
     FIX: XỬ LÝ ĐƯỜNG DẪN THÔNG BÁO BỊ SAI CHỨA PHẦN '/profile'
     ========================================================= */
  const handleClickNotification = async (item: NotificationItem) => {
    if (!item.da_doc) {
      await notificationService.markAsRead(item.id_thong_bao);
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    }

    setShowNotifications(false);

    if (item.lien_ket) {
      let targetLink = item.lien_ket;
      
      // Nếu API trả về link dạng '/profile/orders/7', chuyển nó thành '/orders/7'
      if (targetLink.startsWith("/profile/orders")) {
        targetLink = targetLink.replace("/profile/orders", "/orders");
      }
      
      navigate(targetLink);
    }
  };

  const handleMarkAll = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, da_doc: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="customer-header">
      <div className="customer-header__logo" onClick={() => navigate("/home")}>
        NHÀ NÔNG
      </div>

      <nav className="customer-header__nav">
        <NavLink to="/home">Trang chủ</NavLink>
        <NavLink to="/store">Cửa hàng</NavLink>
        <NavLink to="/ponds">Ao nuôi</NavLink>
        <NavLink to="/debt">Công nợ</NavLink>
        <NavLink to="/blog">Blog</NavLink>
      </nav>

      <div className="customer-header__right">
        <div className="customer-header__bell-wrapper" ref={notificationRef}>
          <button
            className={`customer-header__icon-btn ${showNotifications ? "active" : ""}`}
            onClick={handleOpenNotifications}
            type="button"
          >
            <Bell size={21} />
            {unreadCount > 0 && (
              <span className="customer-header__badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="customer-header__dropdown">
              <div className="dropdown-header">
                <span>Thông báo</span>
                {unreadCount > 0 && (
                  <button type="button" onClick={handleMarkAll}>
                    Đọc tất cả
                  </button>
                )}
              </div>

              <div className="dropdown-body">
                {notifications.length === 0 ? (
                  <div className="dropdown-empty">Chưa có thông báo nào</div>
                ) : (
                  notifications.slice(0, 6).map((item) => (
                    <button
                      key={item.id_thong_bao}
                      className={`dropdown-item ${!item.da_doc ? "unread" : ""}`}
                      onClick={() => handleClickNotification(item)}
                      type="button"
                    >
                      <div className="dropdown-item__icon">
                        {getNotifyIcon(item.loai)}
                      </div>
                      <div className="dropdown-item__content">
                        <strong>{item.tieu_de}</strong>
                        <p>{item.noi_dung}</p>
                        <span>{formatTime(item.ngay_tao)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <button
                className="dropdown-footer"
                type="button"
                onClick={() => {
                  setShowNotifications(false);
                  navigate("/notifications");
                }}
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>

        <button
          className="customer-header__icon-btn"
          onClick={() => navigate("/cart")}
          type="button"
        >
          <ShoppingCart size={21} />
        </button>

        <div className="customer-header__divider" />

        <button
          className="customer-header__user"
          onClick={() => navigate("/profile")}
          type="button"
        >
          <div>
            <strong>{user?.ho_ten || "Người dùng"}</strong>
            <span>{getRoleName()}</span>
          </div>
          <img src={user?.anh_dai_dien || "/shrimp-farm.jpg"} alt="avatar" />
        </button>

        <button
          className="customer-header__logout"
          onClick={handleLogout}
          type="button"
          title="Đăng xuất"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;