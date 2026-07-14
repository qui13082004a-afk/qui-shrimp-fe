import { MapPin, Phone, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import type { DeliveryTask } from "../../../services/delivery.service";
import {
  deliveryStatusLabels,
  formatDate,
  formatMoney,
  getCustomerName,
  getCustomerPhone,
  getPaymentLabel,
} from "../delivery.helpers";
import DeliveryDashboardSkeleton from "./DeliveryDashboardSkeleton";
import DeliveryEmptyState from "./DeliveryEmptyState";

interface TodayDeliveryListProps {
  deliveries: DeliveryTask[];
  loading: boolean;
}

export default function TodayDeliveryList({
  deliveries,
  loading,
}: TodayDeliveryListProps) {
  return (
    <section className="delivery-today-panel">
      <div className="delivery-section-heading">
        <div>
          <span>Hôm nay</span>
          <h2>Danh sách đơn cần giao</h2>
        </div>
        <div className="delivery-section-actions">
          <strong>{deliveries.length} đơn</strong>
          <Link to="/delivery/orders">Xem tất cả đơn</Link>
        </div>
      </div>

      {loading ? (
        <DeliveryDashboardSkeleton />
      ) : deliveries.length === 0 ? (
        <DeliveryEmptyState
          title="Chưa có đơn cần giao"
          description="Các đơn được phân công cho bạn sẽ xuất hiện tại đây."
        />
      ) : (
        <div className="delivery-today-list">
          {deliveries.map((delivery) => (
            <Link
              className="delivery-today-card"
              key={delivery.id_giao_hang}
              to={`/delivery/orders/${delivery.id_giao_hang}`}
            >
              <div className="delivery-today-card__main">
                <div className="delivery-order-icon">
                  <Truck size={22} />
                </div>

                <div>
                  <div className="delivery-today-card__topline">
                    <strong>Đơn #{delivery.id_don_hang}</strong>
                    <span className={`delivery-status ${delivery.trang_thai}`}>
                      {deliveryStatusLabels[delivery.trang_thai]}
                    </span>
                  </div>

                  <h3>{getCustomerName(delivery)}</h3>

                  <p>
                    <MapPin size={16} />
                    {delivery.DonHang?.dia_chi_giao_hang || "Chưa có địa chỉ"}
                  </p>

                  <div className="delivery-today-meta">
                    <span>
                      <Phone size={15} />
                      {getCustomerPhone(delivery)}
                    </span>
                    <span>Đặt ngày {formatDate(delivery.DonHang?.ngay_dat)}</span>
                    <span>
                      {getPaymentLabel(delivery.DonHang?.hinh_thuc_thanh_toan)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="delivery-today-card__amount">
                <span>Tổng tiền</span>
                <strong>{formatMoney(delivery.DonHang?.tong_thanh_toan)}</strong>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
