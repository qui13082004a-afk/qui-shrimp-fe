import axiosClient from "../lib/axios";

export type DeliveryStatus =
  | "cho_giao"
  | "dang_giao"
  | "giao_thanh_cong"
  | "giao_that_bai";

export interface DeliveryCustomer {
  id_nguoi_dung?: number;
  ho_ten?: string | null;
  so_dien_thoai?: string | null;
  email?: string | null;
}

export interface DeliveryOrder {
  id_don_hang: number;
  tong_tien?: number | string | null;
  phi_van_chuyen?: number | string | null;
  tong_thanh_toan?: number | string | null;
  hinh_thuc_thanh_toan?: "cod" | "chuyen_khoan" | "tra_sau" | string;
  trang_thai_don_hang?: string;
  dia_chi_giao_hang?: string | null;
  ghi_chu?: string | null;
  ngay_dat?: string | null;
  ngay_giao?: string | null;
  khoang_cach_giao_hang_km?: number | string | null;
  NguoiDung?: DeliveryCustomer | null;
  AoNuoi?: {
    id_ao?: number;
    ten_ao?: string | null;
    dia_chi_ao?: string | null;
  } | null;
  VuNuoi?: {
    id_vu_nuoi?: number;
    ten_vu_nuoi?: string | null;
    AoNuoi?: {
      id_ao?: number;
      ten_ao?: string | null;
      dia_chi_ao?: string | null;
    } | null;
  } | null;
  ChiTietDonHangs?: DeliveryOrderItem[];
}

export interface DeliveryProduct {
  id_san_pham: number;
  ten_san_pham?: string | null;
  hinh_anh?: string | null;
  don_vi_tinh?: string | null;
}

export interface DeliveryOrderItem {
  id_chi_tiet?: number;
  id_san_pham: number;
  gia_ban: number | string;
  so_luong_dat: number;
  thanh_tien: number | string;
  SanPham?: DeliveryProduct | null;
}

export interface DeliveryTask {
  id_giao_hang: number;
  id_don_hang: number;
  id_nhan_vien_giao?: number | null;
  trang_thai: DeliveryStatus;
  anh_bien_nhan?: string | null;
  anh_hop_dong?: string | null;
  ghi_chu?: string | null;
  thoi_gian_giao?: string | null;
  DonHang?: DeliveryOrder | null;
}

export interface CompleteDeliveryPayload {
  anh_bien_nhan?: string;
  anh_hop_dong?: string;
  ghi_chu?: string;
}

export interface FailDeliveryPayload {
  ly_do_that_bai?: string;
  ghi_chu?: string;
}

const getMyDeliveries = async () => {
  const response = await axiosClient.get("/deliveries/my");
  return response.data.data as DeliveryTask[];
};

const getDeliveryById = async (id: number | string) => {
  const response = await axiosClient.get(`/deliveries/${id}`);
  return response.data.data as DeliveryTask;
};

const startDelivery = async (id: number | string) => {
  const response = await axiosClient.put(`/deliveries/${id}/start`);
  return response.data.data as DeliveryTask;
};

const completeDelivery = async (
  id: number | string,
  payload: CompleteDeliveryPayload
) => {
  const response = await axiosClient.put(`/deliveries/${id}/success`, payload);
  return response.data.data as DeliveryTask;
};

const failDelivery = async (
  id: number | string,
  payload: FailDeliveryPayload
) => {
  const response = await axiosClient.put(`/deliveries/${id}/fail`, payload);
  return response.data.data as DeliveryTask;
};

export const deliveryService = {
  getMyDeliveries,
  getDeliveryById,
  startDelivery,
  completeDelivery,
  failDelivery,
};
