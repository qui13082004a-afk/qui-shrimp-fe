import { NavLink } from "react-router-dom";
import { BarChart3, Bell, History, ListChecks, LogOut } from "lucide-react";
import type { DeliveryUserInfo } from "./DeliveryHeader";

interface DeliveryPageShellProps {
  title: string;
  subtitle: string;
  user: DeliveryUserInfo;
  children: React.ReactNode;
}

const handleLogout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export default function DeliveryPageShell({
  title,
  subtitle,
  user,
  children,
}: DeliveryPageShellProps) {
  return (
    <div className="delivery-page">
      <header className="delivery-shell-header">
        <div>
          <span className="delivery-kicker">NHÂN VIÊN GIAO HÀNG</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <div className="delivery-shell-user">
          <div>
            <strong>{user.ho_ten || "Nhân viên giao hàng"}</strong>
            <span>{user.so_dien_thoai || user.email || "Đang đăng nhập"}</span>
          </div>
          <button type="button" onClick={handleLogout} title="Đăng xuất">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <nav className="delivery-nav">
        <NavLink to="/delivery" end>
          <BarChart3 size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/delivery/orders">
          <ListChecks size={18} />
          Đơn giao
        </NavLink>
        <NavLink to="/delivery/history">
          <History size={18} />
          Lịch sử
        </NavLink>
        <NavLink to="/delivery/notifications">
          <Bell size={18} />
          Thông báo
        </NavLink>
      </nav>

      {children}
    </div>
  );
}
