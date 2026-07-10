import axiosClient from "../lib/axios";

export type DeliveryStatus =
  | "cho_giao"
  | "dang_giao"
  | "giao_thanh_cong"
  | "giao_that_bai";

export type AdminDelivery = {
  id_giao_hang: number;
  id_don_hang: number;
  id_nhan_vien_giao?: number | null;
  trang_thai: DeliveryStatus;
  anh_bien_nhan?: string | null;
  anh_hop_dong?: string | null;
  ghi_chu?: string | null;
  thoi_gian_giao?: string | null;
  DonHang?: any;
  NhanVienGiaoHang?: any;
};

const getAllDeliveries = async () => {
  const res = await axiosClient.get("/deliveries/admin");
  return res.data.data as AdminDelivery[];
};

const getDeliveryById = async (id: number | string) => {
  const res = await axiosClient.get(`/deliveries/${id}`);
  return res.data.data as AdminDelivery;
};

const assignDelivery = async (data: {
  id_don_hang: number | string;
  id_nhan_vien_giao: number | string;
  ghi_chu?: string;
}) => {
  const res = await axiosClient.post("/deliveries/assign", data);
  return res.data.data as AdminDelivery;
};
export type DeliveryOrderOption = {
  id_don_hang: number;
  tong_thanh_toan: number | string;
  trang_thai_don_hang: string;
  NguoiDung?: {
    ho_ten?: string;
    so_dien_thoai?: string;
  };
};

export type DeliveryStaffOption = {
  id_nguoi_dung: number;
  ho_ten: string;
  email: string;
  so_dien_thoai?: string | null;
};

const getReadyOrders = async () => {
  const res = await axiosClient.get("/orders/admin");
  const orders = res.data.data || [];

  return orders.filter((order: DeliveryOrderOption) =>
    ["cho_giao", "da_thanh_toan"].includes(order.trang_thai_don_hang)
  ) as DeliveryOrderOption[];
};

const getDeliveryStaffs = async () => {
  const res = await axiosClient.get("/auth/users", {
    params: {
      vai_tro: "nhan_vien_giao_hang",
      trang_thai_tai_khoan: "hoat_dong",
      page: 1,
      limit: 100,
    },
  });

  return res.data.data.items as DeliveryStaffOption[];
};
export const adminDeliveryService = {
  getAllDeliveries,
  getDeliveryById,
  assignDelivery,
  getReadyOrders,
getDeliveryStaffs,
};