import api from "../lib/axios";

export type PaymentMethod = "cod" | "chuyen_khoan" | "tra_sau";

export interface CreateOrderItem {
  id_san_pham: number;
  so_luong_dat: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItem[];
  hinh_thuc_thanh_toan: PaymentMethod;
  dia_chi_giao_hang: string;
  phi_van_chuyen?: number;
  ghi_chu?: string;
  id_vu_nuoi?: number;
}

export interface PaymentRecord {
  id_thanh_toan: number;
  id_don_hang: number;
  so_tien: number | string;
  phuong_thuc: "cod" | "chuyen_khoan" | "tra_sau";
  ma_giao_dich?: string | null;
  trang_thai: "cho_thanh_toan" | "thanh_cong" | "that_bai";
  thong_bao_loi?: string | null;
  ngay_thanh_toan?: string | null;
}

export interface OrderRecord {
  id_don_hang: number;
  id_nguoi_dung: number;
  id_vu_nuoi?: number | null;
  tong_tien: string | number;
  phi_van_chuyen: string | number;
  tong_thanh_toan: string | number;
  hinh_thuc_thanh_toan: PaymentMethod;
  trang_thai_don_hang: string;
  dia_chi_giao_hang: string;
  ghi_chu?: string | null;
  ngay_dat?: string;
  ngay_duyet?: string | null;
  ngay_giao?: string | null;
  ThanhToans?: PaymentRecord[];
  ChiTietDonHangs?: any[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const orderService = {
  // Tạo đơn hàng
  createOrder: async (payload: CreateOrderPayload) => {
    const response = await api.post<ApiResponse<OrderRecord>>(
      "/orders",
      payload
    );
    return response.data;
  },

  // Danh sách đơn hàng của tôi
  getMyOrders: async () => {
    const response = await api.get<ApiResponse<OrderRecord[]>>("/orders/my");
    return response.data;
  },

  // Chi tiết đơn hàng
  getOrderById: async (orderId: string | number) => {
    const response = await api.get<ApiResponse<OrderRecord>>(
      `/orders/${orderId}`
    );
    return response.data;
  },

  // Hủy đơn hàng
  cancelOrder: async (orderId: string | number) => {
    const response = await api.put<ApiResponse<OrderRecord>>(
      `/orders/${orderId}/cancel`
    );

    return response.data;
  },
};