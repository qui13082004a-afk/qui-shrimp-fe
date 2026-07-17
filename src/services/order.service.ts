import api from "../lib/axios";

export type PaymentMethod = "cod" | "chuyen_khoan" | "tra_sau";

export interface CreateOrderItem {
  id_san_pham: number;
  so_luong_dat: number;
  id_kho_hang?: number;
  id_kho_khach_chon?: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItem[];
  hinh_thuc_thanh_toan: PaymentMethod;
  id_dia_chi_giao_hang?: number;
  dia_chi_giao_hang: string;
  phi_van_chuyen?: number;
  ghi_chu?: string;
  id_ao?: number;
  id_vu_nuoi?: number;
  id_khu_vuc_giao_hang?: number;
  vi_do_giao_hang?: number | string;
  kinh_do_giao_hang?: number | string;
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

export type DeliveryStatus =
  | "cho_giao"
  | "dang_giao"
  | "giao_thanh_cong"
  | "giao_that_bai";

export interface OrderDeliveryRecord {
  id_giao_hang: number;
  id_don_hang: number;
  id_nhan_vien_giao?: number | null;
  id_kho_xuat?: number | null;
  trang_thai: DeliveryStatus;
  anh_bien_nhan?: string | null;
  anh_hop_dong?: string | null;
  ghi_chu?: string | null;
  thoi_gian_giao?: string | null;
  NhanVienGiaoHang?: {
    id_nhan_vien_giao_hang?: number;
    khu_vuc_phu_trach?: string | null;
    NguoiDung?: {
      ho_ten?: string | null;
      so_dien_thoai?: string | null;
      email?: string | null;
    } | null;
  } | null;
  KhoHang?: {
    ten_kho?: string | null;
    dia_chi?: string | null;
  } | null;
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
  id_khu_vuc_giao_hang?: number | null;
  id_diem_xuat_phat?: number | null;
  khoang_cach_giao_hang_km?: number | string | null;
  vi_do_giao_hang?: number | string | null;
  kinh_do_giao_hang?: number | string | null;
  ngay_dat?: string;
  ngay_duyet?: string | null;
  ngay_giao?: string | null;
  ThanhToans?: PaymentRecord[];
  GiaoHangs?: OrderDeliveryRecord[];
  ChiTietDonHangs?: any[];
  NguoiDung?: {
    id_nguoi_dung?: number;
    ho_ten?: string;
    email?: string;
    so_dien_thoai?: string;
    dia_chi?: string;
    tinh_thanh?: string;
  };
  HoSoKhachHang?: any;
}

export interface OrderPreview {
  kho_xuat_du_kien?: {
    id_kho_hang: number;
    ten_kho: string;
    dia_chi?: string | null;
    vi_do?: number | string | null;
    kinh_do?: number | string | null;
  };
  co_chuyen_kho: boolean;
  khoang_cach_kho_km?: number | string | null;
  distance_provider?: string;
  phi_van_chuyen: number;
  tong_tien: number;
  tong_thanh_toan: number;
  van_chuyen?: {
    id_khu_vuc?: number;
    id_diem_xuat_phat?: number | null;
    khoang_cach_km?: number;
    distance_provider?: string;
    phi_van_chuyen?: number;
    pham_vi_phuc_vu?: string;
    thong_bao?: string;
    dia_gioi?: {
      ma_xa?: string;
      ten_xa?: string;
      cap_xa?: string;
      ma_tinh?: string;
      ten_tinh?: string;
    } | null;
    kho_xuat?: {
      id_kho_hang: number;
      ten_kho: string;
      dia_chi?: string | null;
      vi_do?: number | string | null;
      kinh_do?: number | string | null;
    };
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const orderService = {
  previewOrder: async (payload: CreateOrderPayload) => {
    const response = await api.post<ApiResponse<OrderPreview>>(
      "/orders/preview",
      payload
    );
    return response.data;
  },

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

  getAdminOrders: async () => {
    const response = await api.get<ApiResponse<OrderRecord[]>>("/orders/admin");
    return response.data;
  },

  updateOrderStatus: async (
    orderId: string | number,
    trang_thai_don_hang: string
  ) => {
    const response = await api.put<ApiResponse<OrderRecord>>(
      `/orders/${orderId}/status`,
      { trang_thai_don_hang }
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
