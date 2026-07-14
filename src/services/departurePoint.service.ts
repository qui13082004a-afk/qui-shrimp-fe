import axiosClient from "../lib/axios";
import type { ApiResponse } from "./location.service";

export interface DeparturePoint {
  id_diem_xuat_phat: number;
  ten_diem: string;
  dia_chi: string;
  vi_do: string | number;
  kinh_do: string | number;
  ban_kinh_toi_da_km?: string | number | null;
  dang_hoat_dong: boolean;
  la_mac_dinh: boolean;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface DeparturePointPayload {
  ten_diem?: string;
  dia_chi?: string;
  vi_do?: string | number;
  kinh_do?: string | number;
  ban_kinh_toi_da_km?: string | number | null;
  dang_hoat_dong?: boolean;
  la_mac_dinh?: boolean;
}

export const departurePointService = {
  getDeparturePoints: async () => {
    const res = await axiosClient.get<ApiResponse<DeparturePoint[]>>(
      "/departure-points"
    );
    return res.data;
  },

  createDeparturePoint: async (data: DeparturePointPayload) => {
    const res = await axiosClient.post<ApiResponse<DeparturePoint>>(
      "/departure-points",
      data
    );
    return res.data;
  },

  updateDeparturePoint: async (
    id: number | string,
    data: Partial<DeparturePointPayload>
  ) => {
    const res = await axiosClient.put<ApiResponse<DeparturePoint>>(
      `/departure-points/${id}`,
      data
    );
    return res.data;
  },
};
