import axiosClient from "../lib/axios";
import type { AdminUser } from "./adminUser.service";
import type { SupportedPostpaidArea } from "./customerProfile.service";

export type LimitStaffAreaStatus = "dang_phu_trach" | "ngung_phu_trach";

export type LimitStaffAreaAssignment = {
  id_phan_cong: number;
  id_nguoi_dung: number;
  id_khu_vuc: number;
  trang_thai: LimitStaffAreaStatus;
  ghi_chu?: string | null;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
  NguoiDung?: AdminUser;
  KhuVucHoTroTraSau?: SupportedPostpaidArea;
};

export type LimitStaffAreaPayload = {
  id_nguoi_dung: number | string;
  id_khu_vuc: number | string;
  trang_thai?: LimitStaffAreaStatus;
  ghi_chu?: string | null;
};

export type UpdateLimitStaffAreaPayload = {
  trang_thai?: LimitStaffAreaStatus;
  ghi_chu?: string | null;
};

const getAssignments = async () => {
  const response = await axiosClient.get("/limit-staff-areas");
  return response.data.data as LimitStaffAreaAssignment[];
};

const assignStaffToArea = async (payload: LimitStaffAreaPayload) => {
  const response = await axiosClient.post("/limit-staff-areas", payload);
  return response.data.data as LimitStaffAreaAssignment;
};

const updateAssignment = async (
  id: number | string,
  payload: UpdateLimitStaffAreaPayload
) => {
  const response = await axiosClient.put(`/limit-staff-areas/${id}`, payload);
  return response.data.data as LimitStaffAreaAssignment;
};

export const limitStaffAreaService = {
  getAssignments,
  assignStaffToArea,
  updateAssignment,
};
