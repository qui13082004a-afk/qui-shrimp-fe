import axiosClient from "../lib/axios";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Province {
  id_tinh_thanh: number;
  ma_tinh: string;
  ten_tinh: string;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface Ward {
  id_phuong_xa: number;
  ma_xa: string;
  ten_xa: string;
  cap_xa: string;
  id_tinh_thanh: number;
  vi_do_trung_tam: string | number;
  kinh_do_trung_tam: string | number;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export interface CoordinateResolution {
  tim_thay: boolean;
  vi_do: number;
  kinh_do: number;
  dia_gioi: null | {
    ma_xa_goc: string;
    ma_xa: string;
    ten_xa: string;
    cap_xa: string;
    ma_tinh_goc: string;
    ma_tinh: string;
    ten_tinh: string;
    vi_do_trung_tam?: string | number;
    kinh_do_trung_tam?: string | number;
  };
}

export const locationService = {
  importWards: async () => {
    const res = await axiosClient.post<
      ApiResponse<{
        sheet_name: string;
        so_tinh_thanh: number;
        so_phuong_xa: number;
      }>
    >("/locations/import-wards", {});
    return res.data;
  },

  getProvinces: async () => {
    const res = await axiosClient.get<ApiResponse<Province[]>>(
      "/locations/provinces"
    );
    return res.data;
  },

  getWardsByProvince: async (id_tinh_thanh: number | string) => {
    const res = await axiosClient.get<ApiResponse<Ward[]>>(
      `/locations/provinces/${id_tinh_thanh}/wards`
    );
    return res.data;
  },

  resolveCoordinate: async (data: { vi_do: number | string; kinh_do: number | string }) => {
    const res = await axiosClient.post<ApiResponse<CoordinateResolution>>(
      "/locations/resolve-coordinate",
      data
    );
    return res.data;
  },
};
