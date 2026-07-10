import axiosClient from "../lib/axios";

export interface ThreePartyAgreement {
  id_thoa_thuan: number;
  id_ho_so: number;
  id_thuong_lai?: number | null;
  noi_dung?: string;
  file_thoa_thuan?: string | null;
  ghi_chu?: string | null;
  ly_do_huy?: string | null;
  trang_thai: "cho_lap" | "cho_ky" | "cho_xac_nhan" | "da_hieu_luc" | "huy";
  ngay_tao?: string;
  ngay_xac_nhan?: string | null;
  HoSoKhachHang?: any;
  ThuongLai?: any;
}

export const threePartyAgreementService = {
  requestAgreement: async (data: { id_ho_so: number; ly_do?: string; ghi_chu?: string }) => {
    const res = await axiosClient.post("/thoa-thuan-ba-ben/request", data);
    return res.data;
  },

  getAllAgreements: async () => {
    const res = await axiosClient.get("/thoa-thuan-ba-ben");
    return res.data;
  },

  getMyAgreements: async () => {
    const res = await axiosClient.get("/thoa-thuan-ba-ben/my");
    return res.data;
  },

  getAgreementsByProfileId: async (profileId: number | string) => {
    const res = await axiosClient.get(`/thoa-thuan-ba-ben/profile/${profileId}`);
    return res.data;
  },

  getAgreementById: async (id: number | string) => {
    const res = await axiosClient.get(`/thoa-thuan-ba-ben/${id}`);
    return res.data;
  },

  prepareAgreement: async (
    id: number | string,
    data: { id_thuong_lai: number; noi_dung?: string; ghi_chu?: string }
  ) => {
    const res = await axiosClient.put(`/thoa-thuan-ba-ben/${id}/prepare`, data);
    return res.data;
  },

  uploadSignedAgreement: async (
    id: number | string,
    data: { file_thoa_thuan: string; ghi_chu?: string }
  ) => {
    const res = await axiosClient.put(`/thoa-thuan-ba-ben/${id}/upload`, data);
    return res.data;
  },

  confirmAgreement: async (id: number | string, data?: { ghi_chu?: string }) => {
    const res = await axiosClient.put(`/thoa-thuan-ba-ben/${id}/confirm`, data || {});
    return res.data;
  },

  cancelAgreement: async (
    id: number | string,
    data: { ly_do_huy?: string; ghi_chu?: string }
  ) => {
    const res = await axiosClient.put(`/thoa-thuan-ba-ben/${id}/cancel`, data);
    return res.data;
  },
};