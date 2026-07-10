import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Trash2, BellOff } from "lucide-react";
import { notificationService, type NotificationItem } from "../../../services/notification.service";
import "./NotificationsPage.css";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAllNotifications(1, 50); // Lấy tối đa 50 thông báo gần nhất
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const getNotifyIcon = (type: string) => {
    switch (type) {
      case "don_hang": return "📦";
      case "thanh_toan": return "💰";
      case "giao_hang": return "🚚";
      case "ao_nuoi": return "🦐";
      default: return "🔔";
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
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (!item.da_doc) {
      await notificationService.markAsRead(item.id_thong_bao);
      setNotifications((prev) =>
        prev.map((n) => (n.id_thong_bao === item.id_thong_bao ? { ...n, da_doc: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    }

    if (item.lien_ket) {
      let targetLink = item.lien_ket;
      if (targetLink.startsWith("/profile/orders")) {
        targetLink = targetLink.replace("/profile/orders", "/orders");
      }
      navigate(targetLink);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, da_doc: true })));
    setUnreadCount(0);
  };

  return (
    <div className="notifications-page-container">
      <div className="notifications-page-card">
        {/* Header điều khiển */}
        <div className="notifications-page-header">
          <div>
            <h1>Tất cả thông báo</h1>
            <p>Bạn có {unreadCount} thông báo chưa đọc</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn-mark-all" onClick={handleMarkAllRead}>
              <Check size={16} /> Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Nội dung danh sách */}
        <div className="notifications-page-body">
          {loading ? (
            <div className="notifications-page-loading">
              <div className="spinner"></div>
              <p>Đang tải thông báo...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notifications-page-empty">
              <BellOff size={48} />
              <p>Hộp thư thông báo của bạn trống</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((item) => (
                <div
                  key={item.id_thong_bao}
                  className={`notification-page-item ${!item.da_doc ? "unread" : ""}`}
                  onClick={() => handleMarkAsRead(item)}
                >
                  <div className="notification-page-item__icon">
                    {getNotifyIcon(item.loai)}
                  </div>
                  <div className="notification-page-item__content">
                    <div className="notification-page-item__title-row">
                      <strong>{item.tieu_de}</strong>
                      <span className="time">{formatTime(item.ngay_tao)}</span>
                    </div>
                    <p className="message">{item.noi_dung}</p>
                  </div>
                  {!item.da_doc && <div className="unread-dot" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;