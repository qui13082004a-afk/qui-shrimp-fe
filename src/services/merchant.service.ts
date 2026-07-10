import axiosClient from "../lib/axios";

export interface Merchant {
  id_thuong_lai: number;
  ma_thuong_lai?: string;
  ten_thuong_lai: string;
  so_dien_thoai: string;
  dia_chi?: string;
  ma_so_thue?: string;
trang_thai: "hoat_dong" | "tam_khoa" | "ngung_hop_tac";
  so_lan_tham_gia?: number;
  so_lan_vi_pham?: number;
  ghi_chu?: string;
  gia_tom_hien_tai?: number;
}

export const merchantService = {
  createMerchant: async (data: Partial<Merchant>) => {
    const res = await axiosClient.post("/thuong-lai", data);
    return res.data;
  },

  getAllMerchants: async () => {
    const res = await axiosClient.get("/thuong-lai");
    return res.data;
  },

  getActiveMerchants: async () => {
    const res = await axiosClient.get("/thuong-lai/active");
    return res.data;
  },

  getMerchantById: async (id: number | string) => {
    const res = await axiosClient.get(`/thuong-lai/${id}`);
    return res.data;
  },

  updateMerchant: async (id: number | string, data: Partial<Merchant>) => {
    const res = await axiosClient.put(`/thuong-lai/${id}`, data);
    return res.data;
  },

  updateMerchantStatus: async (
    id: number | string,
    data: { trang_thai: Merchant["trang_thai"]; ghi_chu?: string }
  ) => {
    const res = await axiosClient.patch(`/thuong-lai/${id}/status`, data);
    return res.data;
  },

  increaseViolation: async (id: number | string, data?: { ghi_chu?: string }) => {
    const res = await axiosClient.patch(`/thuong-lai/${id}/violation`, data || {});
    return res.data;
  },
};