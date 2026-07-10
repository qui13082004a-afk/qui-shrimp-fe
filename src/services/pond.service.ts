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