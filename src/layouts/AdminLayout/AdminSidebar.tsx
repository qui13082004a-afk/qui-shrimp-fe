import { NavLink, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import "./AdminSidebar.css";

const menuGroups = [
  {
    title: "Tong quan",
    items: [
      {
        label: "Dashboard",
        path: "/admin",
        icon: "📊",
      },
    ],
  },
  {
    title: "Quan ly cong no",
    items: [
      {
        label: "Chinh sach han muc",
        path: "/admin/chinh-sach-han-muc",
        icon: "📌",
      },
      {
        label: "Cong no khach hang",
        path: "/admin/ho-so-cong-no",
        icon: "👤",
      },
      {
        label: "Phieu de xuat han muc",
        path: "/admin/phieu-de-xuat-han-muc",
        icon: "🧾",
      },
      {
        label: "Gia han thanh toan",
        path: "/admin/gia-han-thanh-toan",
        icon: "⏳",
      },
      {
        label: "Hop dong",
        path: "/admin/hop-dong",
        icon: "📄",
      },
    ],
  },
  {
    title: "Quan ly ban hang",
    items: [
      {
        label: "Danh muc",
        path: "/admin/danh-muc",
        icon: "🗂️",
      },
      {
        label: "San pham",
        path: "/admin/san-pham",
        icon: "📦",
      },
      {
        label: "Don hang",
        path: "/admin/don-hang",
        icon: "🛒",
      },
      {
        label: "Giao hang",
        path: "/admin/giao-hang",
        icon: "🚚",
      },
      {
        label: "Khu vuc & van chuyen",
        path: "/admin/khu-vuc-van-chuyen",
        icon: "📍",
      },
    ],
  },
  {
    title: "Quan ly nguoi dung",
    items: [
      {
        label: "Nguoi dung",
        path: "/admin/nguoi-dung",
        icon: "👥",
      },
      {
        label: "Nhan vien giao hang",
        path: "/admin/nhan-vien-giao-hang",
        icon: "🚛",
      },
      {
        label: "Nhan vien dinh muc",
        path: "/admin/nhan-vien-dinh-muc",
        icon: "🧾",
      },
    ],
  },
  {
    title: "Noi dung",
    items: [
      {
        label: "Thong bao",
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

    return activeGroup?.title || "Tong quan";
  }, [location.pathname]);

  const [openGroup, setOpenGroup] = useState(defaultOpenGroup);

  return (
    <>
      {isOpen && <div className="admin-sidebar__overlay" onClick={onClose} />}

      <aside className={`admin-sidebar ${isOpen ? "admin-sidebar--open" : ""}`}>
        <button
          type="button"
          className="admin-sidebar__close"
          onClick={onClose}
          aria-label="Dong menu"
        >
          x
        </button>

        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">LVTN</div>
          <div>
            <h2>Admin</h2>
            <p>Quan tri he thong</p>
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
                  <b>{isOpenGroup ? "-" : "+"}</b>
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
