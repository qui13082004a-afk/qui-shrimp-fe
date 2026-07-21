import api from "../lib/axios";

export interface PayOSPaymentResult {
  checkoutUrl: string;
  orderCode: number;
}

export interface PaymentRecord {
  id_thanh_toan: number;
  id_don_hang: number;
  so_tien: string | number;
  phuong_thuc: "cod" | "chuyen_khoan" | "tra_sau";
  ma_giao_dich?: string | null;
  trang_thai: "cho_thanh_toan" | "thanh_cong" | "that_bai";
  thong_bao_loi?: string | null;
  ngay_thanh_toan?: string | null;
}

export interface PayOSConfirmationResult {
  confirmed: boolean;
  terminal?: boolean;
  status: string;
  type?: "order" | "debt";
  alreadyProcessed?: boolean;
  orderId?: number;
  message?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const paymentService = {
  createPayOSPayment: async (paymentId: string | number) => {
    const response = await api.post<ApiResponse<PayOSPaymentResult>>(
      `/payments/${paymentId}/payos`,
      {}
    );

    return response.data;
  },

  confirmPayOSReturn: async (orderCode: string | number) => {
    const response = await api.post<ApiResponse<PayOSConfirmationResult>>(
      "/payments/payos/confirm-return",
      { orderCode }
    );

    return response.data;
  },

  getPaymentsByOrder: async (orderId: string | number) => {
    const response = await api.get<ApiResponse<PaymentRecord[]>>(
      `/payments/order/${orderId}`
    );

    return response.data;
  },
};
