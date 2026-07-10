import axiosClient from "../lib/axios";

export interface CreditPolicy {
  id_chinh_sach?: number;
  id_admin_cap_nhat?: number | null;

  ten_chinh_sach: string;
  giai_doan: "giai_doan_1" | "giai_doan_2" | "giai_doan_3" | "giai_doan_4";

  tu_ngay: number;
  den_ngay: number;

  han_muc_toi_da: number | string;

  trang_thai?: "hoat_dong" | "tam_dung";
  ghi_chu?: string | null;

  ngay_tao?: string;
  ngay_cap_nhat?: string;
}

export const creditPolicyService = {
  getAllPolicies: async () => {
    const res = await axiosClient.get("/chinh-sach-han-muc/admin");
    return res.data;
  },

  getActivePolicies: async () => {
    const res = await axiosClient.get("/chinh-sach-han-muc/active");
    return res.data;
  },

  getPolicyById: async (id: number | string) => {
    const res = await axiosClient.get(`/chinh-sach-han-muc/${id}`);
    return res.data;
  },

  createPolicy: async (data: CreditPolicy) => {
    const res = await axiosClient.post("/chinh-sach-han-muc", data);
    return res.data;
  },

  updatePolicy: async (id: number | string, data: Partial<CreditPolicy>) => {
    const res = await axiosClient.put(`/chinh-sach-han-muc/${id}`, data);
    return res.data;
  },

  togglePolicyStatus: async (id: number | string) => {
    const res = await axiosClient.patch(`/chinh-sach-han-muc/${id}/status`);
    return res.data;
  },
};