import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { orderService } from "../../../services/order.service";
import type { OrderRecord, PaymentMethod } from "../../../services/order.service";
import "./OrderDetailPage.css";
import { ArrowLeft } from "lucide-react";

type OrderStatus =
  | "cho_xu_ly"
  | "cho_thanh_toan"
  | "da_thanh_toan"
  | "cho_giao"
  | "dang_giao"
  | "hoan_tat"
  | "giao_that_bai"
  | "da_huy";

type OrderItem = {
  id_chi_tiet: number;
  id_san_pham: number;
  gia_ban: string | number;
  so_luong_dat: number;
  thanh_tien: string | number;
  SanPham?: {
    id_san_pham: number;
    ten_san_pham: string;
    hinh_anh?: string | null;
    don_vi_tinh?: string | null;
  };
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  const formatCurrency = (value?: string | number | null) => {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "--/--/----";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const getProductImage = (image?: string | null) => {
    if (!image) return "";

    try {
      const images = JSON.parse(image);
      return Array.isArray(images) ? images[0] || "" : image;
    } catch {
      return image;
    }
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
      cod: "Thanh toán khi nhận hàng",
      chuyen_khoan: "Chuyển khoản",
      tra_sau: "Trả sau",
    };

    return method ? map[method] || method : "--";
  };

  const canCancel =
    order &&
    ["cho_xu_ly", "cho_thanh_toan"].includes(
      String(order.trang_thai_don_hang)
    );

  const loadOrder = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const result = await orderService.getOrderById(id);

      if (!result.success) {
        alert(result.message || "Không thể tải chi tiết đơn hàng.");
        navigate("/orders");
        return;
      }

      setOrder(result.data);
    } catch (error: any) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "Không thể tải chi tiết đơn hàng. Vui lòng thử lại."
      );
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    const ok = window.confirm(
      `Bạn có chắc muốn hủy đơn hàng #${order.id_don_hang} không?`
    );

    if (!ok) return;

    try {
      setCanceling(true);

      const result = await orderService.cancelOrder(order.id_don_hang);

      if (!result.success) {
        alert(result.message || "Không thể hủy đơn hàng.");
        return;
      }

      setOrder({
        ...order,
        ...result.data,
        trang_thai_don_hang: result.data?.trang_thai_don_hang || "da_huy",
      });

      alert("Hủy đơn hàng thành công.");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Không thể hủy đơn hàng.");
    } finally {
      setCanceling(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="order-detail-loading">Đang tải chi tiết đơn hàng...</div>
    );
  }

  if (!order) return null;

  const items = (order.ChiTietDonHangs || []) as OrderItem[];

  return (
    <div className="order-detail-page">
      <button className="order-detail-back" onClick={() => navigate("/orders")}>
        <ArrowLeft size={18} />
        <span>Quay lại đơn hàng</span>
      </button>

      <div className="order-detail-header">
        <div>
          <span>NHÀ NÔNG</span>
          <h1>Chi tiết đơn hàng #{order.id_don_hang}</h1>
          <p>Ngày đặt: {formatDate(order.ngay_dat)}</p>
        </div>

        <div className={`order-detail-status ${order.trang_thai_don_hang}`}>
          {getStatusText(order.trang_thai_don_hang)}
        </div>
      </div>

      <div className="order-detail-grid">
        <section className="order-detail-card">
          <h2>Thông tin đơn hàng</h2>

          <div className="order-info-list">
            <div>
              <span>Phương thức thanh toán</span>
              <strong>{getPaymentText(order.hinh_thuc_thanh_toan)}</strong>
            </div>

            <div>
              <span>Trạng thái đơn hàng</span>
              <strong>{getStatusText(order.trang_thai_don_hang)}</strong>
            </div>

            <div>
              <span>Ngày duyệt</span>
              <strong>{formatDate(order.ngay_duyet)}</strong>
            </div>

            <div>
              <span>Ngày giao</span>
              <strong>{formatDate(order.ngay_giao)}</strong>
            </div>
          </div>

          <div className="order-address-box">
            <span>Địa chỉ giao hàng</span>
            <p>{order.dia_chi_giao_hang}</p>
          </div>

          {order.ghi_chu && (
            <div className="order-address-box">
              <span>Ghi chú</span>
              <p>{order.ghi_chu}</p>
            </div>
          )}
        </section>

        <aside className="order-detail-card">
          <h2>Thanh toán</h2>

          <div className="order-money-row">
            <span>Tạm tính</span>
            <strong>{formatCurrency(order.tong_tien)}</strong>
          </div>

          <div className="order-money-row">
            <span>Phí vận chuyển</span>
            <strong>{formatCurrency(order.phi_van_chuyen)}</strong>
          </div>

          <div className="order-money-total">
            <span>Tổng thanh toán</span>
            <strong>{formatCurrency(order.tong_thanh_toan)}</strong>
          </div>

          {canCancel && (
            <button
              type="button"
              className="order-cancel-btn"
              onClick={handleCancelOrder}
              disabled={canceling}
            >
              {canceling ? "Đang hủy..." : "Hủy đơn hàng"}
            </button>
          )}
        </aside>
      </div>

      <section className="order-detail-card">
        <h2>Sản phẩm đã đặt</h2>

        <div className="order-item-list">
          {items.length === 0 ? (
            <div className="order-detail-empty">Không có sản phẩm.</div>
          ) : (
            items.map((item) => {
              const product = item.SanPham;
              const imageUrl = getProductImage(product?.hinh_anh);

              return (
                <div className="order-item" key={item.id_chi_tiet}>
                  <div className="order-item-image">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product?.ten_san_pham || "Sản phẩm"}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <i className="fa-solid fa-box"></i>
                    )}
                  </div>

                  <div className="order-item-info">
                    <h3>
                      {product?.ten_san_pham || `Sản phẩm #${item.id_san_pham}`}
                    </h3>
                    <p>
                      Đơn giá: {formatCurrency(item.gia_ban)} /{" "}
                      {product?.don_vi_tinh || "sản phẩm"}
                    </p>
                  </div>

                  <div className="order-item-qty">x{item.so_luong_dat}</div>

                  <div className="order-item-total">
                    {formatCurrency(item.thanh_tien)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default OrderDetailPage;