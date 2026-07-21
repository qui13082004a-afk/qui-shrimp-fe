import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Home,
  RefreshCw,
  Store,
  XCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  orderService,
  type OrderRecord,
} from "../../../services/order.service";
import { paymentService } from "../../../services/payment.service";
import "./PaymentSuccessPage.css";

type ViewStatus = "loading" | "success" | "pending" | "failed";

const getLatestPayment = (order: OrderRecord) => {
  return order.ThanhToans?.[0];
};

const getStatusFromOrder = (order: OrderRecord): ViewStatus => {
  const paymentStatus = getLatestPayment(order)?.trang_thai;

  if (paymentStatus === "thanh_cong") return "success";
  if (paymentStatus === "that_bai") return "failed";

  return "pending";
};

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // MoMo thường trả appOrderId/orderId là id đơn hàng nội bộ.
  // PayOS trả orderCode là mã giao dịch thanh toán.
  const appOrderId = searchParams.get("appOrderId") || searchParams.get("orderId");
  const payosOrderCode = searchParams.get("orderCode");
  const orderId = appOrderId && /^\d+$/.test(appOrderId) ? appOrderId : null;

  const method = searchParams.get("method");
  const momoResultCode = searchParams.get("resultCode");
  const momoMessage = searchParams.get("message");

  const payosCode = searchParams.get("code");
  const payosStatus = searchParams.get("status");
  const payosCancel = searchParams.get("cancel");
  const isPayOSRedirect = !!payosOrderCode || !!payosStatus || payosCancel !== null;
  const isPayOSPaid =
    payosStatus === "PAID" && payosCancel === "false" && (!payosCode || payosCode === "00");
  const isPayOSCancelled = payosCancel === "true" || payosStatus === "CANCELLED";

  const [status, setStatus] = useState<ViewStatus>(
    method === "cod" ? "success" : "loading"
  );
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isPayOSRedirect && isPayOSCancelled) {
      setStatus("failed");
      setMessage("Ban da huy thanh toan hoac giao dich chua hoan tat.");
      return;
    }

    if (isPayOSRedirect && payosOrderCode) {
      const verifyPayOSPayment = async () => {
        try {
          const result = await paymentService.confirmPayOSReturn(payosOrderCode);
          const confirmation = result.data;

          if (!confirmation.confirmed) {
            setStatus(confirmation.terminal ? "failed" : "pending");
            setMessage(
              confirmation.message || "Giao dich dang cho PayOS xac nhan."
            );
            return;
          }

          if (confirmation.type === "order" && orderId) {
            const orderResponse = await orderService.getOrderById(orderId);
            setOrder(orderResponse.data);
          }

          setStatus("success");
          setMessage(
            confirmation.type === "debt"
              ? "PayOS da xac nhan thanh toan. Cong no cua ban da duoc cap nhat."
              : "PayOS da xac nhan thanh toan. Don hang da chuyen sang cho giao."
          );

          if (confirmation.type === "order") {
            localStorage.removeItem("cart");
            window.dispatchEvent(new Event("storage"));
          }
        } catch (error: any) {
          setStatus("pending");
          setMessage(
            error.response?.data?.message ||
              "Chua the xac minh giao dich voi PayOS. Vui long thu lai sau it phut."
          );
        }
      };

      verifyPayOSPayment();
      return;
    }

    if (isPayOSRedirect && !orderId) {
      if (!payosOrderCode) {
        setStatus("failed");
        setMessage("Không tìm thấy mã giao dịch sau thanh toán.");
        return;
      }

      if (isPayOSPaid) {
        setStatus("success");
        setMessage("Thanh toán PayOS thành công. Hệ thống đã ghi nhận giao dịch.");
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("storage"));
        return;
      }

      if (isPayOSCancelled) {
        setStatus("failed");
        setMessage("Bạn đã hủy thanh toán hoặc giao dịch chưa được hoàn tất.");
        return;
      }

      setStatus("pending");
      setMessage("Giao dịch đang chờ PayOS xác nhận.");
      return;
    }

    if (!orderId) {
      setStatus("failed");
      setMessage("Không tìm thấy mã đơn hàng sau thanh toán.");
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await orderService.getOrderById(orderId);
        const orderData = res.data;
        const payment = getLatestPayment(orderData);
        const dbErrorMessage = (payment as any)?.thong_bao_loi;

        setOrder(orderData);

        if (method !== "cod" && momoResultCode && momoResultCode !== "0") {
          setStatus("failed");
          setMessage(
            dbErrorMessage ||
              momoMessage ||
              "Giao dịch MoMo không thành công. Đơn hàng chưa được thanh toán."
          );
          return;
        }

        const nextStatus =
          method === "cod" ? "success" : getStatusFromOrder(orderData);

        setStatus(nextStatus);

        if (nextStatus === "failed") {
          setMessage(
            dbErrorMessage ||
              momoMessage ||
              "Giao dịch không thành công hoặc đã bị hủy."
          );
        }

        if (nextStatus === "success") {
          localStorage.removeItem("cart");
          window.dispatchEvent(new Event("storage"));
        }
      } catch (error: any) {
        setStatus("failed");
        setMessage(
          error.response?.data?.message ||
            "Không thể kiểm tra trạng thái thanh toán."
        );
      }
    };

    fetchOrder();
  }, [
    isPayOSRedirect,
    isPayOSPaid,
    isPayOSCancelled,
    payosOrderCode,
    orderId,
    method,
    momoMessage,
    momoResultCode,
  ]);

  const isSuccess = status === "success";
  const isPending = status === "pending" || status === "loading";

  return (
    <div className="payment-result-page">
      <div className={`payment-result-card ${status}`}>
        <div className="result-icon">
          {isSuccess && <CheckCircle2 size={54} />}
          {isPending && <Clock size={54} />}
          {status === "failed" && <XCircle size={54} />}
        </div>

        <span className="result-eyebrow">Nhà Nông</span>

        <h1>
          {isSuccess && "Thanh toán thành công"}
          {status === "loading" && "Đang kiểm tra thanh toán"}
          {status === "pending" && "Thanh toán đang chờ xác nhận"}
          {status === "failed" && "Thanh toán chưa hoàn tất"}
        </h1>

        <p>
          {isSuccess &&
            (message ||
              "Cảm ơn bạn đã thanh toán. Hệ thống đã ghi nhận giao dịch thành công và chuyển đơn sang bộ phận xử lý.")}
          {status === "loading" &&
            "Vui lòng chờ trong giây lát để hệ thống đồng bộ kết quả từ cổng thanh toán."}
          {status === "pending" &&
            (message ||
              "Cổng thanh toán có thể cần thêm thời gian để gửi xác nhận. Bạn có thể làm mới trạng thái sau vài giây.")}
          {status === "failed" &&
            (message ||
              "Giao dịch không thành công hoặc đã bị hủy. Bạn có thể quay lại cửa hàng để đặt lại đơn khi cần.")}
        </p>

        {(order || payosOrderCode) && (
          <div className="result-order-box">
            <div>
              <span>{order ? "Mã đơn hàng" : "Mã giao dịch"}</span>
              <strong>#{order?.id_don_hang || payosOrderCode}</strong>
            </div>

            {order && (
              <>
                <div>
                  <span>Tổng thanh toán</span>
                  <strong>
                    {Number(order.tong_thanh_toan).toLocaleString("vi-VN")}đ
                  </strong>
                </div>

                <div>
                  <span>Trạng thái đơn</span>
                  <strong>{order.trang_thai_don_hang}</strong>
                </div>
              </>
            )}

            {!order && payosStatus && (
              <div>
                <span>Trạng thái thanh toán</span>
                <strong>{payosStatus}</strong>
              </div>
            )}
          </div>
        )}

        <div className="result-actions">
          {isPending && (
            <button
              type="button"
              className="primary"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={18} />
              Làm mới trạng thái
            </button>
          )}

          <button
            type="button"
            className={isPending ? "secondary" : "primary"}
            onClick={() => navigate("/home")}
          >
            <Home size={18} />
            Về trang chủ
          </button>

          <button
            type="button"
            className="secondary"
            onClick={() => navigate("/store")}
          >
            <Store size={18} />
            Tiếp tục mua hàng
          </button>
        </div>
      </div>
    </div>
  );
}
