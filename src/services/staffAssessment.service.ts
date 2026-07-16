import axiosClient from "../lib/axios";

export type StaffProfileStatus =
  | "cho_kiem_tra"
  | "cho_de_xuat"
  | "cho_admin_duyet"
  | "da_duyet"
  | "tu_choi";

export type LimitPolicy = {
  id_chinh_sach: number;
  ten_chinh_sach: string;
  giai_doan: string;
  tu_ngay: number | string;
  den_ngay: number | string;
  han_muc_toi_da: number | string;
  trang_thai: "hoat_dong" | "tam_dung";
  ghi_chu?: string | null;
};

export type StaffCustomerProfile = {
  id_ho_so: number;
  id_nguoi_dung: number;
  id_ao: number;
  id_vu_nuoi: number;
  id_chinh_sach?: number | null;
  dinh_muc_cong_no?: number | string;
  han_muc_con_lai?: number | string;
  duoc_phep_tra_sau?: boolean;
  bi_khoa_tra_sau?: boolean;
  han_thanh_toan?: string | null;
  ngay_duyet?: string | null;
  ghi_chu?: string | null;
  trang_thai_ho_so: StaffProfileStatus;
  ly_do_tu_choi?: string | null;
  ly_do_khoa?: string | null;
  anh_cccd_mat_truoc?: string | null;
  anh_cccd_mat_sau?: string | null;

  NguoiDung?: {
    id_nguoi_dung: number;
    ho_ten: string;
    email: string;
    so_dien_thoai?: string | null;
    dia_chi?: string | null;
    tinh_thanh?: string | null;
  };

  AoNuoi?: {
    id_ao: number;
    ten_ao?: string;
    dien_tich?: number | string;
    dia_chi?: string;
    dia_chi_ao?: string;
    ghi_chu?: string;
  };

  VuNuoi?: {
    id_vu_nuoi: number;
    ten_vu_nuoi?: string;
    ngay_tha_giong?: string;
    so_luong_giong?: number;
    ngay_thu_hoach_du_kien?: string;
    trang_thai?: string;
    ghi_chu?: string;
  };

  ChinhSachHanMuc?: LimitPolicy | null;
};

export type CreateLimitProposalPayload = {
  id_ho_so: number | string;
  id_chinh_sach?: number | string | null;
  han_muc_de_xuat: number | string;
  ly_do_de_xuat: string;
  nhan_xet_khao_sat?: string;
  ph?: number | string;
  oxy_hoa_tan?: number | string;
  kich_co_tom?: string;
  hinh_anh_khao_sat?: string;
  ngay_khao_sat?: string;
  minh_chung_khao_sat?: File[];
};

const appendIfHasValue = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null || value === "") return;
  formData.append(key, String(value));
};

const getAssessmentProfiles = async () => {
  const res = await axiosClient.get("/customer-profiles/admin");
  return res.data.data as StaffCustomerProfile[];
};

const getAssessmentProfileById = async (id: number | string) => {
  const res = await axiosClient.get(`/customer-profiles/${id}`);
  return res.data.data as StaffCustomerProfile;
};

const updateAssessmentProfile = async (
  id: number | string,
  data: Partial<StaffCustomerProfile>
) => {
  const res = await axiosClient.put(`/customer-profiles/${id}`, data);
  return res.data.data as StaffCustomerProfile;
};

const getActiveLimitPolicies = async () => {
  const res = await axiosClient.get("/chinh-sach-han-muc/active");
  return res.data.data as LimitPolicy[];
};

const createLimitProposal = async (data: CreateLimitProposalPayload) => {
  const files = data.minh_chung_khao_sat || [];

  if (files.length === 0) {
    const res = await axiosClient.post("/phieu-de-xuat-han-muc", data);
    return res.data.data;
  }

  const formData = new FormData();

  appendIfHasValue(formData, "id_ho_so", data.id_ho_so);
  appendIfHasValue(formData, "id_chinh_sach", data.id_chinh_sach);
  appendIfHasValue(formData, "han_muc_de_xuat", data.han_muc_de_xuat);
  appendIfHasValue(formData, "ly_do_de_xuat", data.ly_do_de_xuat);
  appendIfHasValue(formData, "nhan_xet_khao_sat", data.nhan_xet_khao_sat);
  appendIfHasValue(formData, "ph", data.ph);
  appendIfHasValue(formData, "oxy_hoa_tan", data.oxy_hoa_tan);
  appendIfHasValue(formData, "kich_co_tom", data.kich_co_tom);
  appendIfHasValue(formData, "ngay_khao_sat", data.ngay_khao_sat);
  appendIfHasValue(formData, "hinh_anh_khao_sat", data.hinh_anh_khao_sat);

  files.forEach((file) => {
    formData.append("hinh_anh_khao_sat", file);
  });

  const res = await axiosClient.post("/phieu-de-xuat-han-muc", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.data;
};

export const staffAssessmentService = {
  getAssessmentProfiles,
  getAssessmentProfileById,
  updateAssessmentProfile,
  getActiveLimitPolicies,
  createLimitProposal,
};
