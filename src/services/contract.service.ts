import axiosClient from "../lib/axios";

export type ContractStatus = "cho_ky" | "cho_xac_nhan" | "da_ky" | "huy";

export type ContractItem = {
  id_hop_dong: number;
  id_ho_so: number;
  file_hop_dong_mau?: string | null;
  file_hop_dong_da_ky?: string | null;
  anh_hop_dong_da_ky?: string | null;
  ngay_tao?: string | null;
  ngay_ky?: string | null;
  ngay_upload?: string | null;
  ngay_xac_nhan?: string | null;
  id_nhan_vien_upload?: number | null;
  id_admin_xac_nhan?: number | null;
  dieu_khoan_bo_sung?: string | null;
  ghi_chu?: string | null;
  trang_thai: ContractStatus;

  HoSoKhachHang?: {
    id_ho_so: number;
    dinh_muc_cong_no?: number | string;
    han_thanh_toan?: string | null;
    ChinhSachHanMuc?: {
      id_chinh_sach?: number;
      ten_chinh_sach?: string;
      giai_doan?: string;
      tu_ngay?: number | string;
      den_ngay?: number | string;
      han_muc_toi_da?: number | string;
      trang_thai?: string;
      ghi_chu?: string | null;
    } | null;
    NguoiDung?: {
      id_nguoi_dung: number;
      ho_ten?: string;
      email?: string;
      so_dien_thoai?: string;
    };
    AoNuoi?: {
      id_ao: number;
      ten_ao?: string;
      dien_tich?: number | string;
      dia_chi_ao?: string;
    };
    VuNuoi?: {
      id_vu_nuoi: number;
      ten_vu_nuoi?: string;
      ngay_tha_giong?: string;
      trang_thai?: string;
    };
  };
};

export type Contract = ContractItem;

export type CreateContractPayload = {
  id_ho_so: number | string;
  file_hop_dong_mau?: string | null;
  ghi_chu?: string | null;
  dieu_khoan_bo_sung?: string | null;
};

// ---- Payload dùng chung cho việc upload file kèm ghi chú/ngày ký ----
export type SignedFileMeta = {
  ngay_ky?: string | null;
  ghi_chu?: string | null;
};

const getAdminContracts = async () => {
  const res = await axiosClient.get("/hop-dong/admin");
  return res.data.data as ContractItem[];
};

const getStaffContracts = async () => {
  const res = await axiosClient.get("/hop-dong/staff");
  return res.data.data as ContractItem[];
};

const getMyContracts = async () => {
  const res = await axiosClient.get("/hop-dong/my");
  return res.data.data as ContractItem[];
};

const getContractById = async (id: number | string) => {
  const res = await axiosClient.get(`/hop-dong/${id}`);
  return res.data.data as ContractItem;
};

const getContractByProfileId = async (profileId: number | string) => {
  const res = await axiosClient.get(`/hop-dong/profile/${profileId}`);
  return res.data.data as ContractItem;
};

const createContract = async (data: CreateContractPayload) => {
  const res = await axiosClient.post("/hop-dong", data);
  return res.data.data as ContractItem;
};

/**
 * Upload file PDF mẫu (chưa ký) lên server, trả về URL/path lưu ở file_hop_dong_mau.
 * Dùng khi tạo hợp đồng (AdminContractPage -> handleCreateContract).
 */
const uploadContractFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosClient.post("/hop-dong/upload-file-mau", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const responseData = res?.data;

  const fileUrl =
    (typeof responseData?.data === "string" ? responseData.data : "") ||
    responseData?.data?.url ||
    responseData?.data?.path ||
    (typeof responseData === "string" ? responseData : "") ||
    responseData?.url ||
    responseData?.path ||
    "";

  if (!fileUrl) {
    console.error("Không lấy được URL PDF mẫu:", responseData);
    throw new Error("Upload PDF thành công nhưng không lấy được URL file");
  }

  return fileUrl;
};

/**
 * Upload PDF hợp đồng đã ký.
 */
const uploadSignedPdf = async (
  id: number | string,
  file: File,
  meta?: SignedFileMeta
) => {
  const formData = new FormData();
  formData.append("file_hop_dong_da_ky", file);

  if (meta?.ngay_ky) formData.append("ngay_ky", meta.ngay_ky);
  if (meta?.ghi_chu) formData.append("ghi_chu", meta.ghi_chu);

  const res = await axiosClient.put(
    `/hop-dong/${id}/upload-pdf`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data.data as ContractItem;
};

/**
 * Upload ảnh hợp đồng đã ký.
 *
 * Hỗ trợ 2 cách gọi để tương thích với cả StaffContractPage và AdminContractPage:
 *   1) uploadSignedImage(id, file, { ngay_ky, ghi_chu })
 *   2) uploadSignedImage(id, { anh_hop_dong_da_ky: file, ngay_ky, ghi_chu })
 */
type UploadSignedImageLegacyPayload = SignedFileMeta & {
  anh_hop_dong_da_ky: File;
};

function uploadSignedImage(
  id: number | string,
  file: File,
  meta?: SignedFileMeta
): Promise<ContractItem>;
function uploadSignedImage(
  id: number | string,
  payload: UploadSignedImageLegacyPayload
): Promise<ContractItem>;
async function uploadSignedImage(
  id: number | string,
  fileOrPayload: File | UploadSignedImageLegacyPayload,
  meta?: SignedFileMeta
) {
  let file: File;
  let ngay_ky: string | null | undefined;
  let ghi_chu: string | null | undefined;

  if (fileOrPayload instanceof File) {
    // Cách gọi mới: uploadSignedImage(id, file, meta)
    file = fileOrPayload;
    ngay_ky = meta?.ngay_ky;
    ghi_chu = meta?.ghi_chu;
  } else {
    // Cách gọi cũ: uploadSignedImage(id, { anh_hop_dong_da_ky, ngay_ky, ghi_chu })
    file = fileOrPayload.anh_hop_dong_da_ky;
    ngay_ky = fileOrPayload.ngay_ky;
    ghi_chu = fileOrPayload.ghi_chu;
  }

  const formData = new FormData();
  formData.append("anh_hop_dong_da_ky", file);

  if (ngay_ky) formData.append("ngay_ky", ngay_ky);
  if (ghi_chu) formData.append("ghi_chu", ghi_chu);

  const res = await axiosClient.put(`/hop-dong/${id}/upload-image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.data as ContractItem;
}

const downloadTemplate = async (id: number | string) => {
  const res = await axiosClient.get(`/hop-dong/${id}/download-template`, {
    responseType: "blob",
  });

  return new Blob([res.data], { type: "application/pdf" });
};

const confirmContract = async (
  id: number | string,
  payload?: { ghi_chu?: string | null }
) => {
  const res = await axiosClient.put(`/hop-dong/${id}/confirm`, {
    ghi_chu: payload?.ghi_chu ?? null,
  });

  return res.data.data as ContractItem;
};

const cancelContract = async (
  id: number | string,
  payload?: { ghi_chu?: string | null }
) => {
  const res = await axiosClient.put(`/hop-dong/${id}/cancel`, {
    ghi_chu: payload?.ghi_chu ?? null,
  });

  return res.data.data as ContractItem;
};

const restoreContract = async (
  id: number | string,
  payload?: { ghi_chu?: string | null }
) => {
  const res = await axiosClient.put(`/hop-dong/${id}/restore`, {
    ghi_chu: payload?.ghi_chu ?? null,
  });

  return res.data.data as ContractItem;
};

export const contractService = {
  getAllContracts: getAdminContracts,
  getAdminContracts,
  getStaffContracts,
  getMyContracts,
  getContractById,
  getContractByProfileId,
  createContract,
  uploadContractFile,
  uploadSignedPdf,
  uploadSignedImage,
  downloadTemplate,
  confirmContract,
  cancelContract,
  restoreContract,
};
