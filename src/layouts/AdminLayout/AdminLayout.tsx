import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import "./AdminLayout.css";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <button type="button" className="admin-header__notification" aria-label="Thông báo">
              <span>🔔</span>
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