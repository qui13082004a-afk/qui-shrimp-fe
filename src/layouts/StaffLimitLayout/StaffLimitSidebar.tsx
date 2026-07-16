import { NavLink } from "react-router-dom";
import "./StaffLimitLayout.css";

type StaffLimitSidebarProps = {
  unreadCount?: number;
};

const menuItems = [
  {
    label: "Hồ sơ cần thẩm định",
    path: "/nhan-vien-dinh-muc/ho-so-tham-dinh",
    icon: "📋",
  },
  {
    label: "Phiếu đề xuất",
    path: "/nhan-vien-dinh-muc/phieu-de-xuat",
    icon: "🧾",
  },
  {
    label: "Tạo phiếu đề xuất",
    path: "/nhan-vien-dinh-muc/tao-phieu-de-xuat",
    icon: "➕",
  },
  {
    label: "Hợp đồng",
    path: "/nhan-vien-dinh-muc/hop-dong",
    icon: "📄",
  },
];

const formatUnreadCount = (count: number) => {
  if (!count) return "";
  return count > 99 ? "99+" : String(count);
};

export default function StaffLimitSidebar({
  unreadCount = 0,
}: StaffLimitSidebarProps) {
  return (
    <aside className="staff-limit-sidebar">
      <div className="staff-limit-sidebar__brand">
        <div className="staff-limit-sidebar__logo">ĐM</div>
        <div>
          <h2>Định mức</h2>
          <p>Thẩm định hồ sơ</p>
        </div>
      </div>

      <nav className="staff-limit-sidebar__nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? "staff-limit-sidebar__link active"
                : "staff-limit-sidebar__link"
            }
          >
            <span>{item.icon}</span>
            <strong>{item.label}</strong>
          </NavLink>
        ))}

        <NavLink
          to="/nhan-vien-dinh-muc/thong-bao"
          className={({ isActive }) =>
            isActive
              ? "staff-limit-sidebar__link active"
              : "staff-limit-sidebar__link"
          }
        >
          <span>🔔</span>
          <strong>Thông báo</strong>
          {unreadCount > 0 && (
            <em className="staff-limit-sidebar__badge">
              {formatUnreadCount(unreadCount)}
            </em>
          )}
        </NavLink>
      </nav>
    </aside>
  );
}
