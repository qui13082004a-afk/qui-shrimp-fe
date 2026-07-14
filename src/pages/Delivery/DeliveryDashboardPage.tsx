import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  CheckCircle2,
  Clock3,
  History,
  ListChecks,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { deliveryService, type DeliveryTask } from "../../services/delivery.service";
import DeliveryHeader, {
  type DeliveryUserInfo,
} from "./components/DeliveryHeader";
import DeliveryStatCard from "./components/DeliveryStatCard";
import TodayDeliveryList from "./components/TodayDeliveryList";
import { isToday } from "./delivery.helpers";
import "./DeliveryDashboardPage.css";

const getStoredUser = (): DeliveryUserInfo => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}") as DeliveryUserInfo;
  } catch {
    return {};
  }
};

const isActiveDelivery = (delivery: DeliveryTask) =>
  ["cho_giao", "dang_giao"].includes(delivery.trang_thai);

const isDeliveryRelatedToToday = (delivery: DeliveryTask) =>
  isToday(delivery.DonHang?.ngay_dat) ||
  isToday(delivery.thoi_gian_giao) ||
  isActiveDelivery(delivery);

export default function DeliveryDashboardPage() {
  const [deliveries, setDeliveries] = useState<DeliveryTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const user = getStoredUser();

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setMessage("");
      const data = await deliveryService.getMyDeliveries();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      setMessage(
        apiError.response?.data?.message ||
          "Không thể tải dashboard giao hàng. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const todayDeliveries = useMemo(
    () => deliveries.filter(isDeliveryRelatedToToday),
    [deliveries]
  );

  const activeTodayDeliveries = useMemo(
    () => todayDeliveries.filter(isActiveDelivery),
    [todayDeliveries]
  );

  const stats = useMemo(
    () => ({
      totalToday: todayDeliveries.length,
      shipping: deliveries.filter((item) => item.trang_thai === "dang_giao")
        .length,
      pending: deliveries.filter((item) => item.trang_thai === "cho_giao")
        .length,
      completedToday: deliveries.filter(
        (item) => item.trang_thai === "giao_thanh_cong" && isToday(item.thoi_gian_giao)
      ).length,
      failed: deliveries.filter((item) => item.trang_thai === "giao_that_bai")
        .length,
    }),
    [deliveries, todayDeliveries]
  );

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="delivery-page">
      <DeliveryHeader
        user={user}
        loading={loading}
        onRefresh={fetchDeliveries}
        onLogout={handleLogout}
      />

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

      {message && (
        <div className="delivery-alert">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}

      <section className="delivery-stats-grid" aria-label="Thống kê giao hàng">
        <DeliveryStatCard
          icon={PackageCheck}
          label="Tổng đơn hôm nay"
          value={stats.totalToday}
          description="Đơn liên quan đến lịch giao hôm nay"
          tone="blue"
        />
        <DeliveryStatCard
          icon={Truck}
          label="Đang giao"
          value={stats.shipping}
          description="Đơn đang trên tuyến giao"
          tone="blue"
        />
        <DeliveryStatCard
          icon={Clock3}
          label="Chờ giao"
          value={stats.pending}
          description="Đơn đã được phân công"
          tone="yellow"
        />
        <DeliveryStatCard
          icon={CheckCircle2}
          label="Hoàn thành hôm nay"
          value={stats.completedToday}
          description="Đơn đã giao thành công trong ngày"
          tone="green"
        />
        <DeliveryStatCard
          icon={XCircle}
          label="Giao thất bại"
          value={stats.failed}
          description="Đơn cần kiểm tra lại với admin"
          tone="red"
        />
      </section>

      <TodayDeliveryList
        deliveries={activeTodayDeliveries}
        loading={loading}
      />
    </div>
  );
}
