import axiosClient from "../lib/axios";

export type NotificationType =
  | "don_hang"
  | "thanh_toan"
  | "giao_hang"
  | "ao_nuoi"
  | "cong_no"
  | "ho_so"
  | "kho_hang"
  | "he_thong";

export interface NotificationItem {
  id_thong_bao: number;
  id_nguoi_dung: number;
  tieu_de: string;
  noi_dung: string;
  loai: NotificationType;
  da_doc: boolean;
  lien_ket?: string | null;
  ngay_tao: string;
}

export interface NotificationResponse {
  unreadCount: number;
  notifications: NotificationItem[];
}

const getMyNotifications = async () => {
  const res = await axiosClient.get("/notifications/me");
  return res.data.data as NotificationResponse;
};

const getAllNotifications = async (page = 1, limit = 20) => {
  const res = await axiosClient.get(
    `/notifications/me?page=${page}&limit=${limit}`
  );
  return res.data.data as NotificationResponse;
};

const markAsRead = async (id: number) => {
  const res = await axiosClient.patch(`/notifications/${id}/read`);
  return res.data;
};

const markAllAsRead = async () => {
  const res = await axiosClient.patch("/notifications/read-all");
  return res.data;
};

export const notificationService = {
  getMyNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
};
