import { NavLink, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import "./AdminSidebar.css";

const menuGroups = [
  {
    title: "Tổng quan",
    items: [
      {
        label: "Dashboard",
        path: "/admin",
        icon: "📊",
      },
    ],
  },
  {
    title: "Quản lý công nợ",
    items: [
      {
        label: "Chính sách hạn mức",
        path: "/admin/chinh-sach-han-muc",
        icon: "📌",
      },
      {
        label: "Công nợ khách hàng",
        path: "/admin/ho-so-cong-no",
        icon: "👤",
      },
      {
        label: "Phiếu đề xuất hạn mức",
        path: "/admin/phieu-de-xuat-han-muc",
        icon: "🧾",
      },
      {
        label: "Gia hạn thanh toán",
        path: "/admin/gia-han-thanh-toan",
        icon: "⏳",
      },
      {
        label: "Hợp đồng",
        path: "/admin/hop-dong",
        icon: "📄",
      },
      {
        label: "Thương lái",
        path: "/admin/thuong-lai",
        icon: "🏪",
      },
    ],
  },
  {
    title: "Quản lý bán hàng",
    items: [
      {
        label: "Danh mục",
        path: "/admin/danh-muc",
        icon: "🗂️",
      },
      {
        label: "Sản phẩm",
        path: "/admin/san-pham",
        icon: "📦",
      },
      {
        label: "Đơn hàng",
        path: "/admin/don-hang",
        icon: "🛒",
      },
      {
        label: "Giao hàng",
        path: "/admin/giao-hang",
        icon: "🚚",
      },
      {
        label: "Khu vực & vận chuyển",
        path: "/admin/khu-vuc-van-chuyen",
        icon: "📍",
      },
    ],
  },
  {
    title: "Quản lý người dùng",
    items: [
      {
        label: "Người dùng",
        path: "/admin/nguoi-dung",
        icon: "👥",
      },
      {
        label: "Nhân viên giao hàng",
        path: "/admin/nhan-vien-giao-hang",
        icon: "🚛",
      },
      {
        label: "Nhân viên định mức",
        path: "/admin/nhan-vien-dinh-muc",
        icon: "🧾",
      },
      
    ],
  },
  {
    title: "Nội dung",
    items: [
      {
        label: "Thông báo",
        path: "/admin/thong-bao",
        icon: "🔔",
      },
    ],
  },
];

type AdminSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const location = useLocation();

  const defaultOpenGroup = useMemo(() => {
    const activeGroup = menuGroups.find((group) =>
      group.items.some((item) => {
        if (item.path === "/admin") {
          return location.pathname === "/admin";
        }

        return location.pathname.startsWith(item.path);
      })
    );

    return activeGroup?.title || "Tổng quan";
  }, [location.pathname]);

  const [openGroup, setOpenGroup] = useState(defaultOpenGroup);

  return (
    <>
      {isOpen && (
        <div className="admin-sidebar__overlay" onClick={onClose} />
      )}

      <aside className={`admin-sidebar ${isOpen ? "admin-sidebar--open" : ""}`}>
        <button
          type="button"
          className="admin-sidebar__close"
          onClick={onClose}
          aria-label="Đóng menu"
        >
          ✕
        </button>

        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">LVTN</div>
          <div>
            <h2>Admin</h2>
            <p>Quản trị hệ thống</p>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          {menuGroups.map((group) => {
            const isOpenGroup = openGroup === group.title;
            const isActiveGroup = group.items.some((item) => {
              if (item.path === "/admin") {
                return location.pathname === "/admin";
              }

              return location.pathname.startsWith(item.path);
            });

            return (
              <div
                key={group.title}
                className={`admin-sidebar__group ${
                  isActiveGroup ? "admin-sidebar__group--active" : ""
                }`}
              >
                <button
                  type="button"
                  className="admin-sidebar__group-btn"
                  onClick={() => setOpenGroup(isOpenGroup ? "" : group.title)}
                >
                  <span>{group.title}</span>
                  <b>{isOpenGroup ? "−" : "+"}</b>
                </button>

                {isOpenGroup && (
                  <div className="admin-sidebar__submenu">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === "/admin"}
                        onClick={onClose}
                        className={({ isActive }) =>
                          isActive
                            ? "admin-sidebar__link active"
                            : "admin-sidebar__link"
                        }
                      >
                        <span className="admin-sidebar__icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
