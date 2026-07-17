import { useEffect, useState } from "react";
import { CreditCard, Home, ReceiptText, RotateCcw, ShoppingBag, XCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { orderService, type OrderRecord } from "../../../services/order.service";
import "./PaymentCancelPage.css";

export default function PaymentCancelPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const paymentId = searchParams.get("paymentId");
  const orderId = searchParams.get("orderId");
  const orderCode = searchParams.get("orderCode");
  const payosStatus = searchParams.get("status");
  const payosCode = searchParams.get("code");

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId) return;

    const loadOrder = async () => {
      try {
        setLoading(true);
        const res = await orderService.getOrderById(orderId);
        setOrder(res.data);
      } catch (error) {
        console.error("LOAD CANCELLED PAYMENT ORDER ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [orderId]);

  const displayOrderCode = order?.id_don_hang || orderId || orderCode || "--";
  const displayPaymentCode = orderCode || paymentId || "--";

  return (
    <div className="payment-cancel-page">
      <section className="payment-cancel-card">
        <div className="payment-cancel-icon">
          <XCircle size={56} strokeWidth={2.4} />
        </div>

        <span className="payment-cancel-eyebrow">Nhà Nông</span>
        <h1>Thanh toán đã được hủy</h1>

        <p>
          Giao dịch PayOS chưa hoàn tất nên đơn hàng chưa được ghi nhận là đã
          thanh toán. Bạn có thể thanh toán lại từ trang đơn hàng hoặc tiếp tục
          mua sắm.
        </p>

        <div className="payment-cancel-summary">
          <div>
            <span>
              <ReceiptText size={16} />
              Mã đơn hàng
            </span>
            <strong>#{displayOrderCode}</strong>
          </div>

          <div>
            <span>
              <CreditCard size={16} />
              Mã giao dịch
            </span>
            <strong>{displayPaymentCode}</strong>
          </div>

          <div>
            <span>Trạng thái PayOS</span>
            <strong>{payosStatus || "CANCELLED"}</strong>
          </div>

          {payosCode && (
            <div>
              <span>Mã phản hồi</span>
              <strong>{payosCode}</strong>
            </div>
          )}

          {order && (
            <div>
              <span>Tổng thanh toán</span>
              <strong>
                {Number(order.tong_thanh_toan || 0).toLocaleString("vi-VN")}đ
              </strong>
            </div>
          )}
        </div>

        {loading && <div className="payment-cancel-loading">Đang tải thông tin đơn hàng...</div>}

        <div className="payment-cancel-actions">
          {orderId && (
            <button
              type="button"
              className="primary"
              onClick={() => navigate(`/orders/${orderId}`)}
            >
              <RotateCcw size={18} />
              Thanh toán lại
            </button>
          )}

          <button type="button" className="secondary" onClick={() => navigate("/orders")}>
            <ReceiptText size={18} />
            Xem đơn hàng
          </button>

          <button type="button" className="secondary" onClick={() => navigate("/store")}>
            <ShoppingBag size={18} />
            Tiếp tục mua hàng
          </button>

          <button type="button" className="ghost" onClick={() => navigate("/home")}>
            <Home size={18} />
            Về trang chủ
          </button>
        </div>
      </section>
    </div>
  );
}
