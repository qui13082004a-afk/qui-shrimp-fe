import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { notificationService } from "../../services/notification.service";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchUnreadCount = async () => {
      try {
        const data = await notificationService.getMyNotifications();

        if (mounted) {
          setUnreadCount(Number(data.unreadCount || 0));
        }
      } catch {
        if (mounted) {
          setUnreadCount(0);
        }
      }
    };

    fetchUnreadCount();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <section className="admin-workspace">
        <header className="admin-header">
          <div className="admin-header__left">
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu"
            >
              ☰
            </button>

            <div className="admin-header__title">
              <span>Hệ thống quản trị</span>
              <strong>Quản trị viên</strong>
            </div>
          </div>

          <div className="admin-header__actions">
            <button
              type="button"
              className={`admin-header__notification ${
                unreadCount > 0 ? "has-unread" : ""
              }`}
              aria-label="Thông báo"
              onClick={() => navigate("/admin/thong-bao")}
            >
              <span>🔔</span>
              {unreadCount > 0 && (
                <em>{unreadCount > 99 ? "99+" : unreadCount}</em>
              )}
            </button>

            <div className="admin-header__user">
              <div className="admin-header__avatar">A</div>
              <div>
                <span>Admin</span>
                <strong>Quản trị hệ thống</strong>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-main">
          <div className="admin-main__inner">
            <Outlet />
          </div>
        </main>
      </section>
    </div>
  );
}
