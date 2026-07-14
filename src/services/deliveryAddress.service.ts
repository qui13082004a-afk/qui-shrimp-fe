import api from "../lib/axios";

export interface DeliveryAddress {
  id_dia_chi: number;
  id_nguoi_dung: number;
  ten_nguoi_nhan: string;
  so_dien_thoai: string;
  dia_chi: string;
  id_tinh_thanh?: number | null;
  id_phuong_xa?: number | null;
  vi_do: number | string;
  kinh_do: number | string;
  la_mac_dinh: boolean;
  dang_hoat_dong: boolean;
  ghi_chu?: string | null;
  TinhThanh?: {
    id_tinh_thanh: number;
    ma_tinh?: string;
    ten_tinh?: string;
  } | null;
  PhuongXa?: {
    id_phuong_xa: number;
    ma_xa?: string;
    ten_xa?: string;
    cap_xa?: string;
  } | null;
}

export interface DeliveryAddressPayload {
  ten_nguoi_nhan: string;
  so_dien_thoai: string;
  dia_chi: string;
  vi_do: number | string;
  kinh_do: number | string;
  la_mac_dinh?: boolean;
  ghi_chu?: string;
}

export const deliveryAddressService = {
  getMyAddresses: async () => {
    const response = await api.get("/delivery-addresses/my");
    return response.data;
  },

  createMyAddress: async (payload: DeliveryAddressPayload) => {
    const response = await api.post("/delivery-addresses/my", payload);
    return response.data;
  },

  updateMyAddress: async (
    id: number | string,
    payload: Partial<DeliveryAddressPayload>
  ) => {
    const response = await api.put(`/delivery-addresses/my/${id}`, payload);
    return response.data;
  },

  setDefaultAddress: async (id: number | string) => {
    const response = await api.put(`/delivery-addresses/my/${id}/default`);
    return response.data;
  },

  deleteMyAddress: async (id: number | string) => {
    const response = await api.delete(`/delivery-addresses/my/${id}`);
    return response.data;
  },
};
