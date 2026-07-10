import axiosClient from "../lib/axios";

export interface CustomerProfileUser {
  id_nguoi_dung?: number;
  ho_ten?: string;
  email?: string;
  so_dien_thoai?: string;
  dia_chi?: string;
  tinh_thanh?: string;
}
export interface CreateCustomerProfilePayload {
  id_ao: number;
  id_vu_nuoi: number;
  ghi_chu?: string;

  anh_cccd_mat_truoc?: string;
  anh_cccd_mat_sau?: string;
  anh_selfie?: string;
}
export interface CustomerProfilePond {
  id_ao?: number;
  ten_ao?: string;
  dien_tich?: number | string;
  dia_chi_ao?: string;
  loai_hinh_nuoi?: string;
  trang_thai_ao?: string;
}

export interface CustomerProfileCropSeason {
  id_vu_nuoi?: number;
  ten_vu_nuoi?: string;
  ngay_tha_giong?: string;
  so_luong_giong?: number;
  ngay_thu_hoach_du_kien?: string;
  trang_thai?: string;
}

export interface LatestDebtExtension {
  id_gia_han?: number;
  han_cu?: string;
  han_de_xuat?: string;
  so_ngay_gia_han?: number;
  ly_do?: string;
  trang_thai?: string;
  ngay_gui?: string;
  ngay_duyet?: string;
}

export interface CustomerDebtProfile {
  id_ho_so?: number;
  id_nguoi_dung?: number;
  id_chinh_sach?: number | null;
  id_ao?: number;
  id_vu_nuoi?: number;

  dinh_muc_cong_no?: number | string;
  trang_thai_ho_so?:
    | "cho_kiem_tra"
    | "cho_de_xuat"
    | "cho_admin_duyet"
    | "da_duyet"
    | "tu_choi";

  ly_do_tu_choi?: string | null;

  bi_khoa_tra_sau?: boolean;
  ly_do_khoa?: string | null;
  duoc_phep_tra_sau?: boolean;

  han_thanh_toan?: string | null;
  han_thanh_toan_goc?: string | null;
  han_thanh_toan_hien_tai?: string | null;

  ngay_duyet?: string | null;
  ghi_chu?: string | null;

  anh_cccd_mat_truoc?: string | null;
  anh_cccd_mat_sau?: string | null;
  anh_selfie?: string | null;

  do_tuong_dong?: number | string | null;
  trang_thai_xac_thuc?: "chua_xac_thuc" | "da_xac_thuc" | "that_bai";
  ly_do_xac_thuc_that_bai?: string | null;
  ngay_xac_thuc?: string | null;

  gia_han_moi_nhat?: LatestDebtExtension | null;

  NguoiDung?: CustomerProfileUser;
  AoNuoi?: CustomerProfilePond;
  VuNuoi?: CustomerProfileCropSeason;
}

// Alias để tương thích với các nơi đang import `CustomerProfile`
// (ví dụ PondsPage.tsx). Giữ nguyên vì đây chính là kiểu hồ sơ công nợ.
export type CustomerProfile = CustomerDebtProfile;

export interface UpdateCustomerProfilePayload {
  trang_thai_ho_so?: CustomerDebtProfile["trang_thai_ho_so"];
  ly_do_tu_choi?: string | null;
  bi_khoa_tra_sau?: boolean;
  ly_do_khoa?: string | null;
  ghi_chu?: string | null;
}

export const customerProfileService = {
  getAllCustomerProfiles: async () => {
    const res = await axiosClient.get("/customer-profiles/admin");
    return res.data;
  },

  getCustomerProfileById: async (id: number | string) => {
    const res = await axiosClient.get(`/customer-profiles/${id}`);
    return res.data;
  },

  updateCustomerProfile: async (
    id: number | string,
    data: UpdateCustomerProfilePayload
  ) => {
    const res = await axiosClient.put(`/customer-profiles/${id}`, data);
    return res.data;
  },
  getMyCustomerProfiles: async () => {
    const res = await axiosClient.get("/customer-profiles/my");
    return res.data;
  },

  createCustomerProfile: async (
    data: CreateCustomerProfilePayload
  ) => {
    const res = await axiosClient.post("/customer-profiles", data);
    return res.data;
  },
};