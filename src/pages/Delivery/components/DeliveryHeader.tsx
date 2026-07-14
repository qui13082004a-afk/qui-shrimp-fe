import { LogOut, RefreshCw } from "lucide-react";

export interface DeliveryUserInfo {
  ho_ten?: string;
  so_dien_thoai?: string;
  email?: string;
}

interface DeliveryHeaderProps {
  user: DeliveryUserInfo;
  loading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function DeliveryHeader({
  user,
  loading,
  onRefresh,
  onLogout,
}: DeliveryHeaderProps) {
  return (
    <header className="delivery-hero">
      <div className="delivery-hero__content">
        <span className="delivery-kicker">NHÂN VIÊN GIAO HÀNG</span>
        <h1>Xin chào, {user.ho_ten || "nhân viên"}</h1>
        <p>
          Theo dõi các đơn được phân công trong ngày và cập nhật tiến độ giao
          hàng đúng lúc.
        </p>
      </div>

      <div className="delivery-hero__actions">
        <div className="delivery-user-card">
          <strong>{user.ho_ten || "Nhân viên giao hàng"}</strong>
          <span>{user.so_dien_thoai || user.email || "Đang đăng nhập"}</span>
        </div>

        <button
          type="button"
          className="delivery-icon-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Tải lại"
        >
          <RefreshCw size={19} className={loading ? "is-spinning" : ""} />
        </button>

        <button
          type="button"
          className="delivery-icon-btn"
          onClick={onLogout}
          title="Đăng xuất"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
