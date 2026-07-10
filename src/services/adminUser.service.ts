import axiosClient from "../lib/axios";

export type UserRole =
  | "admin"
  | "khach_hang"
  | "nhan_vien_giao_hang"
  | "nhan_vien_dinh_muc";

export type UserStatus = "chua_xac_thuc" | "hoat_dong" | "khoa";

export type AdminUser = {
  id_nguoi_dung: number;
  ho_ten: string;
  email: string;
  so_dien_thoai?: string | null;
  vai_tro: UserRole;
  trang_thai_tai_khoan: UserStatus;
  dia_chi?: string | null;
  tinh_thanh?: string | null;
  anh_dai_dien?: string | null;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
};

export type AdminUserListParams = {
  search?: string;
  vai_tro?: UserRole | "tat_ca";
  trang_thai_tai_khoan?: UserStatus | "tat_ca";
  page?: number;
  limit?: number;
};

export type AdminUserListResponse = {
  items: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const getAllUsers = async (params: AdminUserListParams = {}) => {
  const response = await axiosClient.get("/auth/users", { params });
  return response.data.data as AdminUserListResponse;
};

const getUserById = async (id: number | string) => {
  const response = await axiosClient.get(`/auth/users/${id}`);
  return response.data.data as AdminUser;
};

const updateUserRole = async (id: number | string, vai_tro: UserRole) => {
  const response = await axiosClient.patch(`/auth/users/${id}/role`, {
    vai_tro,
  });

  return response.data.data as AdminUser;
};

const updateUserStatus = async (
  id: number | string,
  trang_thai_tai_khoan: UserStatus
) => {
  const response = await axiosClient.patch(`/auth/users/${id}/status`, {
    trang_thai_tai_khoan,
  });

  return response.data.data as AdminUser;
};

export const adminUserService = {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
};