import axiosClient from "../lib/axios";
import type { ApiResponse } from "./location.service";
import type { BusinessArea } from "./businessArea.service";

export interface ShippingFee {
  id_muc_phi: number;
  id_khu_vuc: number;
  tu_km: string | number;
  den_km?: string | number | null;
  phi_co_dinh: string | number;
  dang_hoat_dong: boolean;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
  KhuVucKinhDoanh?: BusinessArea;
}

export interface ShippingFeePayload {
  id_khu_vuc?: number | string;
  tu_km?: number | string;
  den_km?: number | string | null;
  phi_co_dinh?: number | string;
  dang_hoat_dong?: boolean;
}

export interface ShippingCalculationRequest {
  id_khu_vuc?: number | string;
  vi_do: number | string;
  kinh_do: number | string;
}

export interface ShippingCalculation {
  id_khu_vuc: number;
  id_diem_xuat_phat: number;
  khoang_cach_km: number;
  distance_provider: string;
  phi_van_chuyen: number;
  pham_vi_phuc_vu?: string;
  thong_bao?: string;
  dia_gioi?: {
    ma_xa?: string;
    ten_xa?: string;
    cap_xa?: string;
    ma_tinh?: string;
    ten_tinh?: string;
  } | null;
  muc_phi?: ShippingFee | null;
}

export const shippingFeeService = {
  getShippingFees: async () => {
    const res = await axiosClient.get<ApiResponse<ShippingFee[]>>(
      "/shipping-fees"
    );
    return res.data;
  },

  createShippingFee: async (data: ShippingFeePayload) => {
    const res = await axiosClient.post<ApiResponse<ShippingFee>>(
      "/shipping-fees",
      data
    );
    return res.data;
  },

  updateShippingFee: async (
    id: number | string,
    data: Partial<ShippingFeePayload>
  ) => {
    const res = await axiosClient.put<ApiResponse<ShippingFee>>(
      `/shipping-fees/${id}`,
      data
    );
    return res.data;
  },

  calculateShippingFee: async (data: ShippingCalculationRequest) => {
    const res = await axiosClient.post<ApiResponse<ShippingCalculation>>(
      "/shipping-fees/calculate",
      data
    );
    return res.data;
  },
};
