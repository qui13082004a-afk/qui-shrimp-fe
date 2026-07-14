import { useEffect, useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deliveryService, type DeliveryStatus, type DeliveryTask } from "../../services/delivery.service";
import {
  deliveryStatusLabels,
  formatDate,
  formatMoney,
  getCustomerName,
  getCustomerPhone,
  getPaymentLabel,
} from "./delivery.helpers";
import DeliveryEmptyState from "./components/DeliveryEmptyState";
import DeliveryPageShell from "./components/DeliveryPageShell";
import type { DeliveryUserInfo } from "./components/DeliveryHeader";
import "./DeliveryDashboardPage.css";
import "./DeliveryOrdersPage.css";

const PAGE_SIZE = 8;

const getStoredUser = (): DeliveryUserInfo => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}") as DeliveryUserInfo;
  } catch {
    return {};
  }
};

const statusOptions: Array<{ value: DeliveryStatus | "tat_ca"; label: string }> = [
  { value: "tat_ca", label: "Tất cả trạng thái" },
  { value: "cho_giao", label: "Chờ giao" },
  { value: "dang_giao", label: "Đang giao" },
  { value: "giao_thanh_cong", label: "Thành công" },
  { value: "giao_that_bai", label: "Thất bại" },
];

export default function DeliveryOrdersPage() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<DeliveryTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DeliveryStatus | "tat_ca">("tat_ca");
  const [page, setPage] = useState(1);

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
          "Không thể tải danh sách đơn giao."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filteredDeliveries = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return deliveries.filter((delivery) => {
      const matchStatus =
        statusFilter === "tat_ca" || delivery.trang_thai === statusFilter;
      const searchableText = [
        delivery.id_don_hang,
        delivery.id_giao_hang,
        getCustomerName(delivery),
        getCustomerPhone(delivery),
        delivery.DonHang?.dia_chi_giao_hang,
        delivery.DonHang?.hinh_thuc_thanh_toan,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchStatus && (!keyword || searchableText.includes(keyword));
    });
  }, [deliveries, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDeliveries.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedDeliveries = filteredDeliveries.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <DeliveryPageShell
      title="Danh sách đơn giao"
      subtitle="Tra cứu các đơn được phân công và theo dõi trạng thái vận chuyển."
      user={user}
    >
      {message && (
        <div className="delivery-alert">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}

      <section className="delivery-orders-card">
        <div className="delivery-orders-card__head">
          <div>
            <span>Đơn giao</span>
            <h2>Danh sách phân công</h2>
          </div>
          <strong>{filteredDeliveries.length} đơn</strong>
        </div>

        <div className="delivery-orders-toolbar">
          <label className="delivery-search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã đơn, khách hàng, số điện thoại, địa chỉ..."
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as DeliveryStatus | "tat_ca")
            }
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="delivery-table-skeleton">
            {Array.from({ length: 6 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <DeliveryEmptyState
            title="Không có đơn phù hợp"
            description="Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái."
          />
        ) : (
          <>
            <div className="delivery-table-wrap">
              <table className="delivery-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Số điện thoại</th>
                    <th>Địa chỉ</th>
                    <th>Ngày đặt</th>
                    <th>Thanh toán</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDeliveries.map((delivery) => (
                    <tr key={delivery.id_giao_hang}>
                      <td>
                        <strong>#{delivery.id_don_hang}</strong>
                        <span>Phiếu #{delivery.id_giao_hang}</span>
                      </td>
                      <td>{getCustomerName(delivery)}</td>
                      <td>{getCustomerPhone(delivery)}</td>
                      <td className="delivery-table-address">
                        {delivery.DonHang?.dia_chi_giao_hang || "Chưa có"}
                      </td>
                      <td>{formatDate(delivery.DonHang?.ngay_dat)}</td>
                      <td>
                        {getPaymentLabel(delivery.DonHang?.hinh_thuc_thanh_toan)}
                      </td>
                      <td>{formatMoney(delivery.DonHang?.tong_thanh_toan)}</td>
                      <td>
                        <span className={`delivery-status ${delivery.trang_thai}`}>
                          {deliveryStatusLabels[delivery.trang_thai]}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="delivery-detail-btn"
                          onClick={() =>
                            navigate(`/delivery/orders/${delivery.id_giao_hang}`)
                          }
                        >
                          <Eye size={16} />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="delivery-pagination">
              <span>
                Trang {safePage}/{totalPages}
              </span>
              <div>
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </DeliveryPageShell>
  );
}
