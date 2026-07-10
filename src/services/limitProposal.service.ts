import axiosClient from "../lib/axios";

export interface LimitProposalUser {
  id_nguoi_dung?: number;
  ho_ten?: string;
  so_dien_thoai?: string;
  email?: string;
}

export interface LimitProposalPond {
  id_ao?: number;
  ten_ao?: string;
  dien_tich?: number | string;
  dia_chi_ao?: string;
}

export interface LimitProposalCropSeason {
  id_vu_nuoi?: number;
  ten_vu_nuoi?: string;
  ngay_tha_giong?: string;
  trang_thai?: string;
}

export interface LimitProposalPolicy {
  id_chinh_sach?: number;
  ten_chinh_sach?: string;
  giai_doan?: string;
  tu_ngay?: number;
  den_ngay?: number;
  han_muc_toi_da?: number | string;
  trang_thai?: string;
}

export interface LimitProposalCustomerProfile {
  id_ho_so?: number;
  id_nguoi_dung?: number;
  id_ao?: number;
  id_vu_nuoi?: number;

  dinh_muc_cong_no?: number | string;
  duoc_phep_tra_sau?: boolean;
  han_thanh_toan?: string | null;
  trang_thai_ho_so?: string;
  ghi_chu?: string | null;

  NguoiDung?: LimitProposalUser;
  AoNuoi?: LimitProposalPond;
  VuNuoi?: LimitProposalCropSeason;
  ChinhSachHanMuc?: LimitProposalPolicy;
}

export interface LimitProposal {
  id_phieu_de_xuat?: number;
  id_ho_so?: number;
  id_nhan_vien_de_xuat?: number;
  id_admin_duyet?: number | null;

  han_muc_hien_tai?: number | string;
  han_muc_de_xuat?: number | string;
  han_muc_duoc_duyet?: number | string | null;

  ly_do_de_xuat?: string | null;
  nhan_xet_khao_sat?: string | null;

  ph?: number | string | null;
  oxy_hoa_tan?: number | string | null;
  kich_co_tom?: string | null;
  hinh_anh_khao_sat?: string | null;

  trang_thai?: "cho_duyet" | "da_duyet" | "tu_choi";
  ly_do_tu_choi?: string | null;

  ngay_de_xuat?: string;
  ngay_duyet?: string | null;

  HoSoKhachHang?: LimitProposalCustomerProfile;
  ChinhSachHanMuc?: LimitProposalPolicy;
  NguoiDung?: LimitProposalUser;
}

export interface ApproveLimitProposalPayload {
  han_muc_duoc_duyet: number;
  han_thanh_toan: string;
  ghi_chu?: string;
}

export interface RejectLimitProposalPayload {
  ly_do_tu_choi: string;
}

export const limitProposalService = {
  getAllProposals: async () => {
    const res = await axiosClient.get("/phieu-de-xuat-han-muc");
    return res.data;
  },

  getProposalById: async (id: number | string) => {
    const res = await axiosClient.get(`/phieu-de-xuat-han-muc/${id}`);
    return res.data;
  },

  getProposalsByProfileId: async (profileId: number | string) => {
    const res = await axiosClient.get(
      `/phieu-de-xuat-han-muc/profile/${profileId}`
    );
    return res.data;
  },

  approveProposal: async (
    id: number | string,
    data: ApproveLimitProposalPayload
  ) => {
    const res = await axiosClient.put(
      `/phieu-de-xuat-han-muc/${id}/approve`,
      data
    );
    return res.data;
  },

  rejectProposal: async (
    id: number | string,
    data: RejectLimitProposalPayload
  ) => {
    const res = await axiosClient.put(
      `/phieu-de-xuat-han-muc/${id}/reject`,
      data
    );
    return res.data;
  },
};