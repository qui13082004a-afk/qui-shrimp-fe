import axiosClient from "../lib/axios";

export interface DebtExtensionUser {
  id_nguoi_dung?: number;
  ho_ten?: string;
  email?: string;
  so_dien_thoai?: string;
}

export interface DebtExtensionProfile {
  id_ho_so?: number;
  dinh_muc_cong_no?: number | string;
  han_thanh_toan?: string | null;
  trang_thai_ho_so?: string;
  duoc_phep_tra_sau?: boolean;

  NguoiDung?: DebtExtensionUser;
  AoNuoi?: {
    id_ao?: number;
    ten_ao?: string;
    dien_tich?: number | string;
    dia_chi_ao?: string;
  };
  VuNuoi?: {
    id_vu_nuoi?: number;
    ten_vu_nuoi?: string;
    ngay_tha_giong?: string;
    trang_thai?: string;
  };
}

export interface DebtExtension {
  id_gia_han?: number;
  id_ho_so?: number;
  id_nguoi_gui?: number;
  id_nguoi_duyet?: number | null;

  han_cu?: string;
  han_de_xuat?: string;
  so_ngay_gia_han?: number;

  ly_do?: string;
  ghi_chu?: string | null;
  ly_do_tu_choi?: string | null;

  trang_thai: "cho_duyet" | "da_duyet" | "tu_choi";

  ngay_gui?: string;
  ngay_duyet?: string | null;

  hinh_anh_minh_chung?: string[] | string | null;

  HoSoKhachHang?: DebtExtensionProfile;
  nguoi_gui?: DebtExtensionUser;
  nguoi_duyet?: DebtExtensionUser;
}

export interface ApproveDebtExtensionPayload {
  ghi_chu?: string | null;
}

export interface RejectDebtExtensionPayload {
  ly_do_tu_choi: string;
  ghi_chu?: string | null;
}

export const debtExtensionService = {
  getAllDebtExtensions: async () => {
    const res = await axiosClient.get("/debt-extensions/admin");
    return res.data;
  },

  getDebtExtensionById: async (id: number | string) => {
    const res = await axiosClient.get(`/debt-extensions/${id}`);
    return res.data;
  },

  getDebtExtensionsByProfileId: async (profileId: number | string) => {
    const res = await axiosClient.get(`/debt-extensions/profile/${profileId}`);
    return res.data;
  },

  approveDebtExtension: async (
    id: number | string,
    data: ApproveDebtExtensionPayload
  ) => {
    const res = await axiosClient.put(`/debt-extensions/${id}/approve`, data);
    return res.data;
  },

  rejectDebtExtension: async (
    id: number | string,
    data: RejectDebtExtensionPayload
  ) => {
    const res = await axiosClient.put(`/debt-extensions/${id}/reject`, data);
    return res.data;
  },
};