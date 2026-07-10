import api from "../lib/axios";

export const authService = {
  login: (data: { email: string; mat_khau: string }) => {
    return api.post("/auth/login", data);
  },

  register: (data: {
    ho_ten: string;
    so_dien_thoai: string;
    dia_chi: string;
    email: string;
    mat_khau: string;
    tinh_thanh: string;
  }) => {
    return api.post("/auth/register", data);
  },

  verifyEmail: (data: { email: string; otp_code: string }) => {
    return api.post("/auth/verify-email", data);
  },

  resendOtp: (data: { email: string }) => {
    return api.post("/auth/resend-otp", data);
  },

  forgotPassword: (data: { email: string }) => {
    return api.post("/auth/forgot-password", data);
  },

  resetPassword: (data: {
    email: string;
    otp_code: string;
    mat_khau_moi: string;
  }) => {
    return api.post("/auth/reset-password", data);
  },
};