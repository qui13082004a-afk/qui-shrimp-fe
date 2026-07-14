import axiosClient from "../lib/axios";

/* =========================================================
   THÔNG TIN NGƯỜI DÙNG
========================================================= */

export interface CustomerProfileUser {
  id_nguoi_dung?: number;
  ho_ten?: string;
  email?: string;
  so_dien_thoai?: string;
  dia_chi?: string;
  tinh_thanh?: string;
}

/* =========================================================
   THÔNG TIN AO NUÔI
========================================================= */

export interface CustomerProfilePond {
  id_ao?: number;
  ten_ao?: string;
  dien_tich?: number | string;
  dia_chi_ao?: string;
  loai_hinh_nuoi?: string;
  trang_thai_ao?: string;
}

/* =========================================================
   THÔNG TIN VỤ NUÔI
========================================================= */

export interface CustomerProfileCropSeason {
  id_vu_nuoi?: number;
  ten_vu_nuoi?: string;
  ngay_tha_giong?: string;
  so_luong_giong?: number;
  ngay_thu_hoach_du_kien?: string;
  trang_thai?: string;
}

/* =========================================================
   GIA HẠN THANH TOÁN
========================================================= */

export interface LatestDebtExtension {
  id_gia_han?: number;
  han_cu?: string;
  han_de_xuat?: string;
  so_ngay_gia_han?: number;
  ly_do?: string;
  trang_thai?: string;
  ngay_gui?: string;
  ngay_duyet?: string;
}

/* =========================================================
   KHU VỰC HỖ TRỢ TRẢ SAU
========================================================= */

export type SupportedAreaStatus = "hoat_dong" | "tam_ngung";

export interface SupportedPostpaidArea {
  id_khu_vuc?: number;
  tinh_thanh?: string;
  quan_huyen?: string;
  phuong_xa?: string | null;
  trang_thai?: SupportedAreaStatus;
  ghi_chu?: string | null;
}

export interface CheckSupportedAreaPayload {
  tinh_thanh: string;
  quan_huyen: string;
  phuong_xa?: string;
}

export interface CheckSupportedAreaResult {
  duoc_ho_tro: boolean;
  khu_vuc?: SupportedPostpaidArea | null;
}

/* =========================================================
   HỒ SƠ TRẢ SAU
========================================================= */

export interface CustomerDebtProfile {
  id_ho_so?: number;
  id_nguoi_dung?: number;
  id_chinh_sach?: number | null;
  id_ao?: number;
  id_vu_nuoi?: number;

  /* Thông tin cá nhân */
  ho_ten?: string | null;
  ngay_sinh?: string | null;
  so_cccd?: string | null;
  so_dien_thoai?: string | null;
  zalo?: string | null;
  dia_chi_thuong_tru?: string | null;

  /* Địa chỉ ao */
  tinh_thanh_ao?: string | null;
  quan_huyen_ao?: string | null;
  phuong_xa_ao?: string | null;
  dia_chi_chi_tiet_ao?: string | null;

  /* Thông tin hoạt động nuôi */
  dien_tich_ao?: number | string | null;
  don_vi_dien_tich?: string | null;
  so_vu_nuoi_moi_nam?: number | string | null;
  san_luong_du_kien?: number | string | null;
  don_vi_san_luong?: string | null;
  kinh_nghiem_nuoi_nam?: number | string | null;
  nguon_thu_nhap_tra_no?: string | null;
  nguoi_mua_tom_du_kien?: string | null;
  ngay_thu_hoach_du_kien?: string | null;

  /* Nhu cầu trả sau */
  han_muc_mong_muon?: number | string | null;
  thoi_han_tra_mong_muon?: number | string | null;
  don_vi_thoi_han?: string | null;
  mat_hang_du_kien?: string | null;

  /* Người bảo lãnh */
  nguoi_bao_lanh_ho_ten?: string | null;
  nguoi_bao_lanh_sdt?: string | null;
  nguoi_bao_lanh_cccd?: string | null;
  nguoi_bao_lanh_quan_he?: string | null;

  /* Hạn mức được duyệt */
  dinh_muc_cong_no?: number | string;

  trang_thai_ho_so?:
    | "cho_kiem_tra"
    | "cho_de_xuat"
    | "cho_admin_duyet"
    | "da_duyet"
    | "tu_choi";

  ly_do_tu_choi?: string | null;

  bi_khoa_tra_sau?: boolean;
  ly_do_khoa?: string | null;
  duoc_phep_tra_sau?: boolean;

  han_thanh_toan?: string | null;
  han_thanh_toan_goc?: string | null;
  han_thanh_toan_hien_tai?: string | null;

  ngay_duyet?: string | null;
  ghi_chu?: string | null;

  /* Ảnh hồ sơ */
  anh_cccd_mat_truoc?: string | null;
  anh_cccd_mat_sau?: string | null;
  anh_selfie?: string | null;
  anh_bien_lai_tha_giong?: string | null;
  anh_ao_nuoi?: string | string[] | null;

  /* Cam kết */
  cam_ket_thong_tin?: boolean;
  dong_y_xac_minh?: boolean;
  dong_y_dieu_khoan?: boolean;

  /* Xác thực khuôn mặt */
  do_tuong_dong?: number | string | null;

  trang_thai_xac_thuc?:
    | "chua_xac_thuc"
    | "da_xac_thuc"
    | "that_bai";

  ly_do_xac_thuc_that_bai?: string | null;
  ngay_xac_thuc?: string | null;

  gia_han_moi_nhat?: LatestDebtExtension | null;

  NguoiDung?: CustomerProfileUser;
  AoNuoi?: CustomerProfilePond;
  VuNuoi?: CustomerProfileCropSeason;
}

/*
 * Giữ alias này để các file cũ như PondsPage.tsx
 * vẫn import CustomerProfile bình thường.
 */
export type CustomerProfile = CustomerDebtProfile;

/* =========================================================
   PAYLOAD TẠO HỒ SƠ CŨ
   Giữ lại để những component cũ không bị lỗi TypeScript.
========================================================= */

export interface CreateCustomerProfilePayload {
  id_ao: number;
  id_vu_nuoi: number;
  ghi_chu?: string;

  anh_cccd_mat_truoc?: string;
  anh_cccd_mat_sau?: string;
  anh_selfie?: string;
}

/* =========================================================
   PAYLOAD TẠO HỒ SƠ MỚI
========================================================= */

export interface CreatePostpaidProfileFormPayload {
  id_ao: number;
  id_vu_nuoi: number;

  ho_ten: string;
  ngay_sinh: string;
  so_cccd: string;
  so_dien_thoai: string;
  zalo?: string;
  dia_chi_thuong_tru: string;

  tinh_thanh_ao: string;
  quan_huyen_ao: string;
  phuong_xa_ao: string;
  dia_chi_chi_tiet_ao?: string;

  dien_tich_ao: number | string;
  don_vi_dien_tich?: string;
  so_vu_nuoi_moi_nam: number | string;
  san_luong_du_kien: number | string;
  don_vi_san_luong?: string;
  kinh_nghiem_nuoi_nam: number | string;
  nguon_thu_nhap_tra_no: string;
  nguoi_mua_tom_du_kien?: string;
  ngay_thu_hoach_du_kien: string;

  han_muc_mong_muon: number | string;
  thoi_han_tra_mong_muon: number | string;
  don_vi_thoi_han?: string;
  mat_hang_du_kien: string;

  nguoi_bao_lanh_ho_ten?: string;
  nguoi_bao_lanh_sdt?: string;
  nguoi_bao_lanh_cccd?: string;
  nguoi_bao_lanh_quan_he?: string;

  cam_ket_thong_tin: boolean;
  dong_y_xac_minh: boolean;
  dong_y_dieu_khoan: boolean;

  ghi_chu?: string;

  anh_cccd_mat_truoc: File;
  anh_cccd_mat_sau: File;
  anh_selfie: File;
  anh_bien_lai_tha_giong: File;
  anh_ao_nuoi?: File[];
}

/* =========================================================
   PAYLOAD CẬP NHẬT HỒ SƠ
========================================================= */

export interface UpdateCustomerProfilePayload {
  trang_thai_ho_so?: CustomerDebtProfile["trang_thai_ho_so"];
  ly_do_tu_choi?: string | null;

  bi_khoa_tra_sau?: boolean;
  ly_do_khoa?: string | null;

  ghi_chu?: string | null;

  zalo?: string;
  so_dien_thoai?: string;
  dia_chi_thuong_tru?: string;

  nguon_thu_nhap_tra_no?: string;
  nguoi_mua_tom_du_kien?: string;
  ngay_thu_hoach_du_kien?: string;

  han_muc_mong_muon?: number | string;
  thoi_han_tra_mong_muon?: number | string;
  don_vi_thoi_han?: string;
  mat_hang_du_kien?: string;

  nguoi_bao_lanh_ho_ten?: string;
  nguoi_bao_lanh_sdt?: string;
  nguoi_bao_lanh_cccd?: string;
  nguoi_bao_lanh_quan_he?: string;

  trang_thai_xac_thuc?:
    | "chua_xac_thuc"
    | "da_xac_thuc"
    | "that_bai";

  ly_do_xac_thuc_that_bai?: string | null;
  do_tuong_dong?: number | string | null;
  ngay_xac_thuc?: string | null;
}

export interface ApprovePostpaidPayload {
  id_chinh_sach?: number | null;
  dinh_muc_cong_no: number;
  han_thanh_toan: string;
  ghi_chu?: string;
}

/* =========================================================
   RESPONSE CHUNG
========================================================= */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/* =========================================================
   HELPER TẠO FORMDATA
========================================================= */

const appendFormValue = (
  formData: FormData,
  key: string,
  value: unknown
) => {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (value instanceof File) {
    formData.append(key, value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (item instanceof File) {
        formData.append(key, item);
      } else {
        formData.append(key, String(item));
      }
    });

    return;
  }

  formData.append(key, String(value));
};

const createCustomerProfileFormData = (
  payload: CreatePostpaidProfileFormPayload
) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    appendFormValue(formData, key, value);
  });

  return formData;
};

/* =========================================================
   GỬI MULTIPART/FORM-DATA

   Dự án hiện có interceptor Axios đặt Content-Type JSON.
   Vì vậy các API có file phải ghi đè thành multipart/form-data.
========================================================= */

const postCustomerProfileFormData = async (
  formData: FormData
): Promise<ApiResponse<CustomerDebtProfile>> => {
  const res = await axiosClient.post<
    ApiResponse<CustomerDebtProfile>
  >("/customer-profiles", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

/* =========================================================
   SERVICE
========================================================= */

export const customerProfileService = {
  /* API cũ: Admin xem toàn bộ hồ sơ */
  getAllCustomerProfiles: async (): Promise<
    ApiResponse<CustomerDebtProfile[]>
  > => {
    const res = await axiosClient.get<
      ApiResponse<CustomerDebtProfile[]>
    >("/customer-profiles/admin");

    return res.data;
  },

  /* API cũ: Xem chi tiết hồ sơ */
  getCustomerProfileById: async (
    id: number | string
  ): Promise<ApiResponse<CustomerDebtProfile>> => {
    const res = await axiosClient.get<
      ApiResponse<CustomerDebtProfile>
    >(`/customer-profiles/${id}`);

    return res.data;
  },

  /* API cũ: Cập nhật hồ sơ */
  updateCustomerProfile: async (
    id: number | string,
    data: UpdateCustomerProfilePayload
  ): Promise<ApiResponse<CustomerDebtProfile>> => {
    const res = await axiosClient.put<
      ApiResponse<CustomerDebtProfile>
    >(`/customer-profiles/${id}`, data);

    return res.data;
  },

  /* API cũ: Khách xem hồ sơ của mình */
  getMyCustomerProfiles: async (): Promise<
    ApiResponse<CustomerDebtProfile[]>
  > => {
    const res = await axiosClient.get<
      ApiResponse<CustomerDebtProfile[]>
    >("/customer-profiles/my");

    return res.data;
  },

  /*
   * API cũ giữ nguyên.
   * Method này vẫn nhận object JSON để component cũ không bị lỗi.
   *
   * Tuy nhiên hồ sơ mới có ảnh nên component mới phải dùng
   * createPostpaidProfile() ở phía dưới.
   */
  createCustomerProfile: async (
    data: CreateCustomerProfilePayload
  ): Promise<ApiResponse<CustomerDebtProfile>> => {
    const res = await axiosClient.post<
      ApiResponse<CustomerDebtProfile>
    >("/customer-profiles", data);

    return res.data;
  },

  /*
   * API dùng cho component đã tự tạo FormData.
   * Ví dụ: DebtRegistration/index.tsx.
   */
  create: async (
    formData: FormData
  ): Promise<ApiResponse<CustomerDebtProfile>> => {
    return await postCustomerProfileFormData(formData);
  },

  /*
   * API mới: nhận object có File rồi tự chuyển thành FormData.
   */
  createPostpaidProfile: async (
    payload: CreatePostpaidProfileFormPayload
  ): Promise<ApiResponse<CustomerDebtProfile>> => {
    const formData =
      createCustomerProfileFormData(payload);

    return await postCustomerProfileFormData(formData);
  },

  /* API mới: kiểm tra khu vực ao có được hỗ trợ */
  checkSupportedArea: async (
    payload: CheckSupportedAreaPayload
  ): Promise<ApiResponse<CheckSupportedAreaResult>> => {
    const res = await axiosClient.post<
      ApiResponse<CheckSupportedAreaResult>
    >("/khu-vuc-ho-tro-tra-sau/check", payload);

    return res.data;
  },

  /* API Admin duyệt trả sau */
  approvePostpaid: async (
    id: number | string,
    payload: ApprovePostpaidPayload
  ): Promise<ApiResponse<CustomerDebtProfile>> => {
    const res = await axiosClient.put<
      ApiResponse<CustomerDebtProfile>
    >(
      `/customer-profiles/${id}/approve-postpaid`,
      payload
    );

    return res.data;
  },

  /* API Admin lấy danh sách khu vực */
  getSupportedAreas: async (): Promise<
    ApiResponse<SupportedPostpaidArea[]>
  > => {
    const res = await axiosClient.get<
      ApiResponse<SupportedPostpaidArea[]>
    >("/khu-vuc-ho-tro-tra-sau");

    return res.data;
  },

  /* API Admin thêm khu vực */
  createSupportedArea: async (
    payload: Omit<SupportedPostpaidArea, "id_khu_vuc">
  ): Promise<ApiResponse<SupportedPostpaidArea>> => {
    const res = await axiosClient.post<
      ApiResponse<SupportedPostpaidArea>
    >("/khu-vuc-ho-tro-tra-sau", payload);

    return res.data;
  },

  /* API Admin cập nhật hoặc bật/tắt khu vực */
  updateSupportedArea: async (
    id: number | string,
    payload: Partial<SupportedPostpaidArea>
  ): Promise<ApiResponse<SupportedPostpaidArea>> => {
    const res = await axiosClient.put<
      ApiResponse<SupportedPostpaidArea>
    >(`/khu-vuc-ho-tro-tra-sau/${id}`, payload);

    return res.data;
  },
};