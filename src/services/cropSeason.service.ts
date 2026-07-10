import axios from "../lib/axios";

export interface CropSeason {
  id_vu_nuoi: number;
  id_ao: number;
  ten_vu_nuoi: string;
  ngay_tha_giong?: string;
  so_luong_giong?: number;
  ngay_thu_hoach_du_kien?: string;
  trang_thai: "dang_nuoi" | "da_thu_hoach" | "huy";
  ghi_chu?: string;
}

export interface SeasonOrderProduct {
  id_chi_tiet: number;
  id_san_pham: number;
  ten_san_pham: string;
  hinh_anh?: string | null;
  don_vi_tinh?: string | null;
  gia_ban: number;
  so_luong_dat: number;
  thanh_tien: number;
  trang_thai_san_pham?: string | null;
}

export interface SeasonOrderItem {
  id_don_hang: number;
  ngay_dat: string;
  tong_tien: number;
  phi_van_chuyen: number;
  tong_thanh_toan: number;
  hinh_thuc_thanh_toan: "cod" | "chuyen_khoan" | "tra_sau";
  trang_thai_don_hang:
    | "cho_xu_ly"
    | "cho_thanh_toan"
    | "da_thanh_toan"
    | "cho_giao"
    | "dang_giao"
    | "hoan_tat"
    | "giao_that_bai"
    | "da_huy";
  ghi_chu?: string | null;
  san_pham: SeasonOrderProduct[];
}

export interface SeasonOrderSummary {
  id_vu_nuoi: number;
  ten_vu_nuoi: string;
  trang_thai: string;
  ngay_tha_giong?: string;
  so_luong_giong?: number;
  ngay_thu_hoach_du_kien?: string;
  ao_nuoi: {
    id_ao: number;
    ten_ao: string;
    dien_tich: string | number;
    dia_chi_ao?: string;
  };
  tong_so_don: number;
  tong_von: number;
  don_hoan_tat: number;
  don_dang_xu_ly: number;
  orders: SeasonOrderItem[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const cropSeasonService = {
  getCropSeasonsByPond: async (id_ao: number) => {
    const response = await axios.get<ApiResponse<CropSeason[]>>(
      `/crop-seasons/pond/${id_ao}`
    );
    return response.data;
  },

  createCropSeason: async (data: Partial<CropSeason>) => {
    const response = await axios.post<ApiResponse<CropSeason>>(
      "/crop-seasons",
      data
    );
    return response.data;
  },

  updateCropSeason: async (id_vu_nuoi: number, data: Partial<CropSeason>) => {
    const response = await axios.put<ApiResponse<CropSeason>>(
      `/crop-seasons/${id_vu_nuoi}`,
      data
    );
    return response.data;
  },

  getSeasonOrderSummary: async (id_vu_nuoi: number) => {
    const response = await axios.get<ApiResponse<SeasonOrderSummary>>(
      `/crop-seasons/${id_vu_nuoi}/orders-summary`
    );
    return response.data;
  },
};
