import axios from "../lib/axios";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DebtLimitByPond {
  id_ho_so: number;
  id_ao: number | null;
  id_vu_nuoi: number | null;
  ten_ao: string;
  dinh_muc_cong_no: number;

  tong_cong_no?: number;
  cong_no_hien_tai?: number;
  currentDebt?: number;

  dang_giu_han_muc?: number;
  reservedDebt?: number;
  da_su_dung?: number;

  da_thanh_toan?: number;
  con_lai?: number;
  phan_tram_su_dung?: number;
  han_thanh_toan?: string | null;
}

export interface DebtSummary {
  tong_han_muc: number;
  tong_gia_tri_mua_tra_sau: number;
  da_thanh_toan: number;
  tong_cong_no: number;
  cong_no_hien_tai?: number;
  dang_giu_han_muc?: number;
  da_su_dung?: number;
  con_lai: number;
  han_gan_nhat: string | null;
  so_ho_so_duoc_duyet: number;
  so_don_tra_sau: number;

  han_muc_theo_ho_so?: DebtLimitByPond[];
  tong_quan_theo_ao?: DebtLimitByPond[];
}

export interface DebtOrder {
  loai: "phat_sinh" | "thanh_toan";
  ngay_giao_dich: string | null;
  noi_dung: string;
  vu_nuoi: string | null;
  ao_nuoi: string | null;
  so_tien: number;
  trang_thai: string;
  ma_giao_dich?: string | null;
}

export interface DebtProfileDetail {
  id_ho_so: number;
  id_nguoi_dung: number;
  id_ao: number | null;
  id_vu_nuoi: number | null;

  ten_ao: string;
  dien_tich?: number | string | null;
  dia_chi_ao?: string | null;
  loai_hinh_nuoi?: string | null;

  ten_vu_nuoi?: string | null;
  ngay_tha_giong?: string | null;
  so_luong_giong?: number | null;
  ngay_thu_hoach_du_kien?: string | null;

  dinh_muc_cong_no: number;
  cong_no_hien_tai: number;
  dang_giu_han_muc: number;
  da_su_dung: number;
  da_thanh_toan: number;
  con_lai: number;
  phan_tram_su_dung: number;

  han_thanh_toan?: string | null;
  ngay_duyet?: string | null;
  ghi_chu?: string | null;
  so_don_lien_quan: number;
}

export interface DebtTransaction {
  id: string;
  ngay: string;
  loai: "mua_hang" | "thanh_toan";
  noi_dung: string;
  so_tien: number;
  trang_thai: string;
  id_don_hang: number;
}

export const debtService = {
  getMySummary: async () => {
    const res = await axios.get<ApiResponse<DebtSummary>>("/debts/my-summary");
    return res.data;
  },

  getMyDebtOrders: async () => {
    const res = await axios.get<ApiResponse<DebtOrder[]>>("/debts/my-orders");
    return res.data;
  },

  getDebtProfileDetail: async (profileId: string | number) => {
    const res = await axios.get<ApiResponse<DebtProfileDetail>>(
      `/debts/profile/${profileId}`
    );
    return res.data;
  },
getPaymentByOrder: async (orderId: number | string) => {
  const res = await axios.get(`/payments/order/${orderId}`);
  return res.data;
},
  getDebtProfileTransactions: async (profileId: string | number) => {
    const res = await axios.get<ApiResponse<DebtTransaction[]>>(
      `/debts/profile/${profileId}/transactions`
    );
    return res.data;
  },
payPartialDebt: async (so_tien: number, id_ho_so?: number | null) => {
  const payload: {
    so_tien: number;
    id_ho_so?: number;
  } = { so_tien };

  if (id_ho_so) {
    payload.id_ho_so = id_ho_so;
  }

  const res = await axios.post("/debts/pay-partial", payload);
  return res.data;
},
};
