import { useEffect, useMemo, useState } from "react";
import { orderService, type OrderRecord } from "../../services/order.service";
import "./AdminCommon.css";
import "./AdminSalesPages.css";

const orderStatusLabels: Record<string, string> = {
  cho_xu_ly: "Chờ xử lý",
  cho_thanh_toan: "Chờ thanh toán",
  da_thanh_toan: "Đã thanh toán",
  cho_giao: "Chờ giao",
  dang_giao: "Đang giao",
  hoan_tat: "Hoàn tất",
  giao_that_bai: "Giao thất bại",
  da_huy: "Đã hủy",
};

const paymentLabels: Record<string, string> = {
  cod: "COD",
  chuyen_khoan: "Chuyển khoản",
  tra_sau: "Trả sau",
};

const statusOptions = [
  "cho_xu_ly",
  "cho_thanh_toan",
  "da_thanh_toan",
  "cho_giao",
  "dang_giao",
  "hoan_tat",
  "giao_that_bai",
  "da_huy",
];

const formatMoney = (value?: number | string | null) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";

const getStatusClass = (status: string) => {
  if (["hoan_tat", "da_thanh_toan"].includes(status)) return "green";
  if (["cho_giao", "dang_giao"].includes(status)) return "blue";
  if (["da_huy", "giao_that_bai"].includes(status)) return "red";
  return "yellow";
};

export default function AdminOrderPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tat_ca");
  const [paymentFilter, setPaymentFilter] = useState("tat_ca");
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getAdminOrders();
      setOrders(res.data || []);
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể tải đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const customerName = order.NguoiDung?.ho_ten?.toLowerCase() || "";
      const customerPhone = order.NguoiDung?.so_dien_thoai?.toLowerCase() || "";
      const matchSearch =
        !keyword ||
        String(order.id_don_hang).includes(keyword) ||
        customerName.includes(keyword) ||
        customerPhone.includes(keyword);
      const matchStatus =
        statusFilter === "tat_ca" || order.trang_thai_don_hang === statusFilter;
      const matchPayment =
        paymentFilter === "tat_ca" || order.hinh_thuc_thanh_toan === paymentFilter;

      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((item) => item.trang_thai_don_hang === "cho_xu_ly")
        .length,
      delivery: orders.filter((item) =>
        ["cho_giao", "dang_giao"].includes(item.trang_thai_don_hang)
      ).length,
      revenue: orders
        .filter((item) => item.trang_thai_don_hang !== "da_huy")
        .reduce((sum, item) => sum + Number(item.tong_thanh_toan || 0), 0),
    }),
    [orders]
  );

  const updateStatus = async (order: OrderRecord, nextStatus: string) => {
    if (!nextStatus || nextStatus === order.trang_thai_don_hang) return;

    try {
      setUpdatingId(order.id_don_hang);
      await orderService.updateOrderStatus(order.id_don_hang, nextStatus);
      setAlert("Cập nhật trạng thái đơn hàng thành công.");
      await loadOrders();
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể cập nhật đơn hàng.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-page admin-sales-page admin-order-page">
      <div className="admin-page__header admin-page__header--between admin-order-hero">
        <div>
          <p className="admin-page__eyebrow">Quản lý bán hàng</p>
          <h1>Đơn hàng</h1>
          <p>Theo dõi đơn, thanh toán, phí vận chuyển và cập nhật trạng thái xử lý.</p>
        </div>
        <button
          className="admin-secondary-btn admin-order-refresh"
          type="button"
          onClick={loadOrders}
        >
          Làm mới
        </button>
      </div>

      {alert && <div className="admin-alert admin-order-alert">{alert}</div>}

      <div className="admin-sales-stats admin-order-stats">
        <div className="admin-sales-card admin-order-stat-card">
          <span>Tổng đơn</span>
          <strong>{stats.total}</strong>
          <p>Toàn bộ đơn hàng</p>
        </div>
        <div className="admin-sales-card admin-order-stat-card admin-order-stat-card--pending">
          <span>Chờ xử lý</span>
          <strong>{stats.pending}</strong>
          <p>Cần admin kiểm tra</p>
        </div>
        <div className="admin-sales-card admin-order-stat-card admin-order-stat-card--delivery">
          <span>Đang giao</span>
          <strong>{stats.delivery}</strong>
          <p>Chờ giao hoặc đang giao</p>
        </div>
        <div className="admin-sales-card admin-order-stat-card admin-order-stat-card--revenue">
          <span>Doanh thu đơn</span>
          <strong>{formatMoney(stats.revenue)}</strong>
          <p>Không tính đơn đã hủy</p>
        </div>
      </div>

      <div className="admin-card admin-sales-list-card admin-order-list-card">
        <div className="admin-sales-card__top admin-order-list-head">
          <div>
            <h2>Danh sách đơn hàng</h2>
            <p>Tìm theo mã đơn, tên khách hoặc số điện thoại.</p>
          </div>
        </div>

        <div className="admin-sales-toolbar admin-order-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã đơn, tên khách, số điện thoại..."
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="tat_ca">Tất cả trạng thái</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {orderStatusLabels[status]}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
          >
            <option value="tat_ca">Tất cả thanh toán</option>
            <option value="cod">COD</option>
            <option value="chuyen_khoan">Chuyển khoản</option>
            <option value="tra_sau">Trả sau</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-order-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Thanh toán</th>
                <th>Tổng tiền</th>
                <th>Phí ship</th>
                <th>Trạng thái</th>
                <th>Ngày đặt</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-empty">Đang tải dữ liệu...</div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-empty">Không có đơn hàng phù hợp</div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id_don_hang}>
                    <td>
                      <strong>#{order.id_don_hang}</strong>
                      <span>
                        {order.khoang_cach_giao_hang_km
                          ? `${Number(order.khoang_cach_giao_hang_km).toFixed(1)} km`
                          : "Chưa có khoảng cách"}
                      </span>
                    </td>
                    <td>
                      <strong>{order.NguoiDung?.ho_ten || "—"}</strong>
                      <span>{order.NguoiDung?.so_dien_thoai || "Chưa có SĐT"}</span>
                    </td>
                    <td>
                      <span className="admin-order-payment">
                        {paymentLabels[order.hinh_thuc_thanh_toan] ||
                          order.hinh_thuc_thanh_toan}
                      </span>
                    </td>
                    <td>
                      <strong>{formatMoney(order.tong_thanh_toan)}</strong>
                      <span>Tạm tính: {formatMoney(order.tong_tien)}</span>
                    </td>
                    <td>{formatMoney(order.phi_van_chuyen)}</td>
                    <td>
                      <span className={`admin-badge ${getStatusClass(order.trang_thai_don_hang)}`}>
                        {orderStatusLabels[order.trang_thai_don_hang] ||
                          order.trang_thai_don_hang}
                      </span>
                    </td>
                    <td>{formatDate(order.ngay_dat)}</td>
                    <td>
                      <div className="admin-actions admin-order-actions">
                        <button type="button" onClick={() => setSelectedOrder(order)}>
                          Chi tiết
                        </button>
                        <select
                          className="admin-order-status-select"
                          value={order.trang_thai_don_hang}
                          disabled={updatingId === order.id_don_hang}
                          onChange={(event) => updateStatus(order, event.target.value)}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {orderStatusLabels[status]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="admin-modal-overlay">
          <div className="admin-modal wide admin-order-modal">
            <div className="admin-modal__header">
              <div>
                <h2>Chi tiết đơn #{selectedOrder.id_don_hang}</h2>
                <p>Thông tin khách hàng, giao hàng và sản phẩm trong đơn.</p>
              </div>
              <button
                className="admin-modal__close"
                type="button"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>

            <div className="admin-order-detail">
              <div>
                <span>Khách hàng</span>
                <strong>{selectedOrder.NguoiDung?.ho_ten || "—"}</strong>
              </div>
              <div>
                <span>Số điện thoại</span>
                <strong>{selectedOrder.NguoiDung?.so_dien_thoai || "—"}</strong>
              </div>
              <div>
                <span>Địa chỉ giao hàng</span>
                <strong>{selectedOrder.dia_chi_giao_hang || "—"}</strong>
              </div>
              <div>
                <span>Khoảng cách giao</span>
                <strong>
                  {selectedOrder.khoang_cach_giao_hang_km
                    ? `${Number(selectedOrder.khoang_cach_giao_hang_km).toFixed(2)} km`
                    : "—"}
                </strong>
              </div>
              <div>
                <span>Tổng sản phẩm</span>
                <strong>{formatMoney(selectedOrder.tong_tien)}</strong>
              </div>
              <div>
                <span>Phí vận chuyển</span>
                <strong>{formatMoney(selectedOrder.phi_van_chuyen)}</strong>
              </div>
              <div>
                <span>Tổng thanh toán</span>
                <strong>{formatMoney(selectedOrder.tong_thanh_toan)}</strong>
              </div>
              <div>
                <span>Ghi chú</span>
                <strong>{selectedOrder.ghi_chu || "—"}</strong>
              </div>
            </div>

            <div className="admin-order-items">
              <h3>Sản phẩm trong đơn</h3>
              <div className="admin-table-wrap">
                <table className="admin-table admin-order-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Giá bán</th>
                      <th>Số lượng</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.ChiTietDonHangs || []).map((item: any) => (
                      <tr key={item.id_chi_tiet}>
                        <td>
                          <strong>{item.SanPham?.ten_san_pham || `#${item.id_san_pham}`}</strong>
                          <span>{item.trang_thai_san_pham || ""}</span>
                        </td>
                        <td>{formatMoney(item.gia_ban)}</td>
                        <td>{Number(item.so_luong_dat || 0).toLocaleString("vi-VN")}</td>
                        <td>{formatMoney(item.thanh_tien)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
