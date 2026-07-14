import axios from '../lib/axios';

export interface Pond {
  id_ao: number;
  id_nguoi_dung: number;
  ten_ao: string;
  dien_tich: number;
  dia_chi_ao?: string;
  loai_hinh_nuoi?: string;
  trang_thai_ao: 'dang_hoat_dong' | 'tam_ngung';
  ghi_chu?: string;
  id_tinh_thanh?: number | null;
  id_phuong_xa?: number | null;
  vi_do?: number | string | null;
  kinh_do?: number | string | null;
  TinhThanh?: {
    id_tinh_thanh: number;
    ma_tinh: string;
    ten_tinh: string;
  } | null;
  PhuongXa?: {
    id_phuong_xa: number;
    ma_xa: string;
    ten_xa: string;
    cap_xa: string;
    vi_do_trung_tam?: number | string | null;
    kinh_do_trung_tam?: number | string | null;
  } | null;
  ngay_tao: string;
}

// Định nghĩa một Interface riêng dành cho biểu mẫu nhập liệu
export interface PondPayload {
  ten_ao: string;
  dien_tich: number;
  dia_chi_ao?: string;
  loai_hinh_nuoi?: string;
  trang_thai_ao?: string;
  ghi_chu?: string;
  id_tinh_thanh?: number | string | null;
  id_phuong_xa?: number | string | null;
  vi_do?: number | string | null;
  kinh_do?: number | string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const pondService = {
  getMyPonds: async () => {
    const response = await axios.get<ApiResponse<Pond[]>>('/ponds/my');
    return response.data;
  },

  // Thay đổi kiểu dữ liệu nhận vào thành PondPayload
  createPond: async (data: PondPayload) => {
    const response = await axios.post<ApiResponse<Pond>>('/ponds', data);
    return response.data;
  },

  // Chấp nhận một phần dữ liệu thay đổi dựa trên PondPayload
  updatePond: async (id_ao: number, data: Partial<PondPayload>) => {
    const response = await axios.put<ApiResponse<Pond>>(`/ponds/${id_ao}`, data);
    return response.data;
  },

  deletePond: async (id_ao: number) => {
    const response = await axios.delete<{ success: boolean; message: string }>(`/ponds/${id_ao}`);
    return response.data;
  },
};
