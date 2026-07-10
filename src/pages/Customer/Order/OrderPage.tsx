import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Search,
  ShoppingBag,
  PackageCheck,
  Wallet,
  Truck,
  CalendarDays,
  MapPin,
  Eye,
  XCircle,
  CreditCard,
} from "lucide-react";
import { orderService } from "../../../services/order.service";
import { paymentService } from "../../../services/payment.service";
import type { OrderRecord, PaymentMethod } from "../../../services/order.service";
import "./OrderPage.css";

type OrderStatus =
  | "cho_xu_ly"
  | "cho_thanh_toan"
  | "da_thanh_toan"
  | "cho_giao"
  | "dang_giao"
  | "hoan_tat"
  | "giao_that_bai"
  | "da_huy";

const OrderPage = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const showError = (message: string) => {
    Swal.fire({
      icon: "error",
      title: "Có lỗi xảy ra",
      text: message,
      confirmButtonText: "Đóng",
      confirmButtonColor: "#004077",
    });
  };

  const showSuccess = (message: string) => {
    Swal.fire({
      icon: "success",
      title: "Thành công",
      text: message,
      confirmButtonText: "OK",
      confirmButtonColor: "#004077",
      timer: 1600,
      timerProgressBar: true,
    });
  };

  const formatCurrency = (value?: string | number | null) =>
    `${Number(value || 0).toLocaleString("vi-VN")} đ`;

  const formatDate = (date?: string | null) => {
    if (!date) return "--/--/----";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const getStatusText = (status?: string) => {
    const map: Record<OrderStatus, string> = {
      cho_xu_ly: "Chờ xác nhận",
      cho_thanh_toan: "Chờ thanh toán",
      da_thanh_toan: "Đã thanh toán",
      cho_giao: "Chờ giao",
      dang_giao: "Đang giao",
      hoan_tat: "Hoàn tất",
      giao_that_bai: "Giao thất bại",
      da_huy: "Đã hủy",
    };

    return map[status as OrderStatus] || status || "--";
  };

  const getPaymentText = (method?: PaymentMethod) => {
    const map: Record<PaymentMethod, string> = {
      cod: "COD",
      chuyen_khoan: "Chuyển khoản",
      tra_sau: "Trả sau",
    };

    return method ? map[method] || method : "--";
  };

  const canCancelOrder = (order: OrderRecord) => {
    return ["cho_xu_ly", "cho_thanh_toan"].includes(
      String(order.trang_thai_don_hang)
    );
  };

  const loadOrders = async () => {
    try {
      setLoading(true);

      const result = await orderService.getMyOrders();

      if (!result.success) {
        showError(result.message || "Không thể tải danh sách đơn hàng.");
        return;
      }

      setOrders(result.data || []);
    } catch (error: any) {
      console.error(error);
      showError(
        error.response?.data?.message ||
          "Không thể tải danh sách đơn hàng. Vui lòng đăng nhập lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayOrder = async (order: OrderRecord) => {
    try {
      setPayingId(order.id_don_hang);

      let pendingPayment = order.ThanhToans?.find(
        (item) =>
          item.trang_thai === "cho_thanh_toan" &&
          item.phuong_thuc === "chuyen_khoan"
      );

      if (!pendingPayment) {
        const paymentResult = await paymentService.getPaymentsByOrder(
          order.id_don_hang
        );

        pendingPayment = paymentResult.data?.find(
          (item) =>
            item.trang_thai === "cho_thanh_toan" &&
            item.phuong_thuc === "chuyen_khoan"
        );
      }

      if (!pendingPayment) {
        showError("Không tìm thấy giao dịch chờ thanh toán của đơn hàng này.");
        return;
      }

      const result = await paymentService.createPayOSPayment(
        pendingPayment.id_thanh_toan
      );

      if (!result.success || !result.data?.checkoutUrl) {
        showError(result.message || "Không thể tạo thanh toán.");
        return;
      }

      window.location.href = result.data.checkoutUrl;
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Không thể tạo thanh toán.");
    } finally {
      setPayingId(null);
    }
  };

  const handleCancelOrder = async (order: OrderRecord) => {
    if (!canCancelOrder(order)) {
      showError("Chỉ có thể hủy đơn khi đơn còn chờ xác nhận hoặc chờ thanh toán.");
      return;
    }

    const confirmResult = await Swal.fire({
      icon: "warning",
      title: `Hủy đơn hàng #${order.id_don_hang}?`,
      html: `
        <div style="font-size:15px;color:#64748b;line-height:1.5">
          Bạn có chắc chắn muốn hủy đơn hàng này không?
          <br/>
          <b style="color:#dc2626">Thao tác này không thể hoàn tác.</b>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Hủy đơn",
      cancelButtonText: "Không hủy",
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: "order-swal-popup",
        icon: "order-swal-icon",
        title: "order-swal-title",
        htmlContainer: "order-swal-text",
        actions: "order-swal-actions",
        confirmButton: "order-swal-confirm",
        cancelButton: "order-swal-cancel",
      },
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setCancelingId(order.id_don_hang);

      const result = await orderService.cancelOrder(order.id_don_hang);

      if (!result.success) {
        showError(result.message || "Không thể hủy đơn hàng.");
        return;
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id_don_hang === order.id_don_hang
            ? {
                ...item,
                ...result.data,
                trang_thai_don_hang:
                  result.data?.trang_thai_don_hang || "da_huy",
              }
            : item
        )
      );

      showSuccess("Hủy đơn hàng thành công.");
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Không thể hủy đơn hàng.");
    } finally {
      setCancelingId(null);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const keywordValue = keyword.trim().toLowerCase();

      const matchKeyword =
        !keywordValue ||
        String(order.id_don_hang).includes(keywordValue) ||
        String(order.dia_chi_giao_hang || "")
          .toLowerCase()
          .includes(keywordValue);

      const matchStatus =
        statusFilter === "all" || order.trang_thai_don_hang === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [orders, keyword, statusFilter]);

  if (loading) {
    return (
      <div className="order-loading">
        <ShoppingBag size={30} />
        <span>Đang tải đơn hàng...</span>
      </div>
    );
  }

  return (
    <div className="order-page">
      <div className="order-header">
        <div className="order-header-left">
          <div className="order-header-icon">
            <ShoppingBag size={30} />
          </div>

          <div className="order-header-content">
            <span>Lịch sử mua hàng</span>
            <h2>Đơn hàng của tôi</h2>
            <p>Theo dõi trạng thái đặt hàng, giao hàng và thanh toán.</p>
          </div>
        </div>

        <button
          type="button"
          className="order-shop-btn"
          onClick={() => navigate("/store")}
        >
          <ShoppingBag size={17} />
          Tiếp tục mua hàng
        </button>
      </div>

      <div className="order-tools">
        <div className="order-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã đơn hoặc địa chỉ..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="cho_xu_ly">Chờ xác nhận</option>
          <option value="cho_thanh_toan">Chờ thanh toán</option>
          <option value="da_thanh_toan">Đã thanh toán</option>
          <option value="cho_giao">Chờ giao</option>
          <option value="dang_giao">Đang giao</option>
          <option value="hoan_tat">Hoàn tất</option>
          <option value="giao_that_bai">Giao thất bại</option>
          <option value="da_huy">Đã hủy</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="order-empty">
          <PackageCheck size={42} />
          <h3>Chưa có đơn hàng</h3>
          <p>Bạn chưa có đơn hàng nào phù hợp với bộ lọc hiện tại.</p>
          <button type="button" onClick={() => navigate("/store")}>
            Mua hàng ngay
          </button>
        </div>
      ) : (
        <div className="order-list">
          {filteredOrders.map((order) => (
            <div className="order-card" key={order.id_don_hang}>
              <div className="order-card-top">
                <div>
                  <p className="order-code">Mã đơn #{order.id_don_hang}</p>
                  <h3>{formatCurrency(order.tong_thanh_toan)}</h3>
                </div>

                <span className={`order-status ${order.trang_thai_don_hang}`}>
                  {getStatusText(order.trang_thai_don_hang)}
                </span>
              </div>

              <div className="order-info-grid">
                <div>
                  <Wallet size={18} />
                  <span>Thanh toán</span>
                  <strong>{getPaymentText(order.hinh_thuc_thanh_toan)}</strong>
                </div>

                <div>
                  <Truck size={18} />
                  <span>Phí vận chuyển</span>
                  <strong>{formatCurrency(order.phi_van_chuyen)}</strong>
                </div>

                <div>
                  <CalendarDays size={18} />
                  <span>Ngày đặt</span>
                  <strong>{formatDate(order.ngay_dat)}</strong>
                </div>

                <div>
                  <PackageCheck size={18} />
                  <span>Ngày giao</span>
                  <strong>{formatDate(order.ngay_giao)}</strong>
                </div>
              </div>

              <div className="order-address">
                <MapPin size={18} />
                <div>
                  <span>Địa chỉ giao hàng</span>
                  <p>{order.dia_chi_giao_hang}</p>
                </div>
              </div>

              <div className="order-actions">
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${order.id_don_hang}`)}
                >
                  <Eye size={17} />
                  Xem chi tiết
                </button>

                {order.trang_thai_don_hang === "cho_thanh_toan" &&
                  order.hinh_thuc_thanh_toan === "chuyen_khoan" && (
                    <button
                      type="button"
                      className="pay-btn"
                      onClick={() => handlePayOrder(order)}
                      disabled={payingId === order.id_don_hang}
                    >
                      <CreditCard size={17} />
                      {payingId === order.id_don_hang
                        ? "Đang tạo..."
                        : "Thanh toán"}
                    </button>
                  )}

                {canCancelOrder(order) && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => handleCancelOrder(order)}
                    disabled={cancelingId === order.id_don_hang}
                  >
                    <XCircle size={17} />
                    {cancelingId === order.id_don_hang
                      ? "Đang hủy..."
                      : "Hủy đơn"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderPage;