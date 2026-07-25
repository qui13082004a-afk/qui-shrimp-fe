import { LogOut, RefreshCw } from "lucide-react";
import DeliveryAccountCard from "./DeliveryAccountCard";

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
        <span className="delivery-kicker">NHAN VIEN GIAO HANG</span>
        <h1>Xin chao, {user.ho_ten || "nhan vien"}</h1>
        <p>
          Theo doi cac don duoc phan cong trong ngay va cap nhat tien do giao
          hang dung luc.
        </p>
      </div>

      <div className="delivery-hero__actions">
        <DeliveryAccountCard user={user} />

        <button
          type="button"
          className="delivery-icon-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Tai lai"
        >
          <RefreshCw size={19} className={loading ? "is-spinning" : ""} />
        </button>

        <button
          type="button"
          className="delivery-icon-btn"
          onClick={onLogout}
          title="Dang xuat"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
