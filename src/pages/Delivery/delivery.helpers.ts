import type { DeliveryStatus, DeliveryTask } from "../../services/delivery.service";

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  cho_giao: "Chờ giao",
  dang_giao: "Đang giao",
  giao_thanh_cong: "Hoàn thành",
  giao_that_bai: "Thất bại",
};

export const paymentLabels: Record<string, string> = {
  cod: "COD",
  chuyen_khoan: "Chuyển khoản",
  tra_sau: "Trả sau",
};

export const formatMoney = (value?: number | string | null) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

export const formatDate = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  return new Date(value).toLocaleDateString("vi-VN");
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  return new Date(value).toLocaleString("vi-VN");
};

export const isToday = (value?: string | null) => {
  if (!value) return false;

  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

export const getCustomerName = (delivery: DeliveryTask) =>
  delivery.DonHang?.NguoiDung?.ho_ten || "Khách hàng";

export const getCustomerPhone = (delivery: DeliveryTask) =>
  delivery.DonHang?.NguoiDung?.so_dien_thoai || "Chưa có SĐT";

export const getPaymentLabel = (payment?: string | null) =>
  payment ? paymentLabels[payment] || payment : "Chưa rõ";

export const getProductImage = (image?: string | null) => {
  if (!image) return "";

  try {
    const parsed = JSON.parse(image) as unknown;
    return Array.isArray(parsed) ? String(parsed[0] || "") : image;
  } catch {
    return image;
  }
};
