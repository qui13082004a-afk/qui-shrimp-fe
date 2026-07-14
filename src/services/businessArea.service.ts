import axiosClient from "../lib/axios";
import type { ApiResponse, Province } from "./location.service";

export interface BusinessArea {
  id_khu_vuc: number;
  id_tinh_thanh: number;
  cho_phep_ban_hang: boolean;
  cho_phep_tra_sau: boolean;
  dang_hoat_dong: boolean;
  ban_kinh_toi_da_km?: string | number | null;
  phi_van_chuyen_mac_dinh: string | number;
  ghi_chu?: string | null;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
  TinhThanh?: Province;
}

export interface BusinessAreaPayload {
  id_tinh_thanh?: number | string;
  cho_phep_ban_hang?: boolean;
  cho_phep_tra_sau?: boolean;
  dang_hoat_dong?: boolean;
  ban_kinh_toi_da_km?: number | string | null;
  phi_van_chuyen_mac_dinh?: number | string;
  ghi_chu?: string | null;
}

export const businessAreaService = {
  getBusinessAreas: async () => {
    const res = await axiosClient.get<ApiResponse<BusinessArea[]>>(
      "/business-areas"
    );
    return res.data;
  },

  createBusinessArea: async (data: BusinessAreaPayload) => {
    const res = await axiosClient.post<ApiResponse<BusinessArea>>(
      "/business-areas",
      data
    );
    return res.data;
  },

  updateBusinessArea: async (
    id: number | string,
    data: Partial<BusinessAreaPayload>
  ) => {
    const res = await axiosClient.put<ApiResponse<BusinessArea>>(
      `/business-areas/${id}`,
      data
    );
    return res.data;
  },
};
