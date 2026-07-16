import api from "../lib/axios";
import type { Category } from "./category.service";
import type { ProductStock } from "./warehouse.service";

export type ProductStatus = "dang_ban" | "ngung_ban" | "het_hang";

export interface Product {
  id_san_pham: number;
  id_danh_muc: number;
  ten_san_pham: string;
  mo_ta?: string | null;
  cong_dung?: string | null;
  huong_dan_su_dung?: string | null;
  gia: number | string;
  don_vi_tinh?: string | null;
  ton_kho: number;
  ton_kho_toi_thieu?: number;
  hinh_anh?: string | string[] | null;
  han_su_dung?: string | null;
  xuat_xu?: string | null;
  trang_thai: ProductStatus;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
  DanhMuc?: Category;
  TonKhoSanPhams?: ProductStock[];
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  id_danh_muc?: number | string | null;
  id_kho_hang?: number | string | null;
  trang_thai?: ProductStatus | "tat_ca" | null;
  minPrice?: number | string;
  maxPrice?: number | string;
  sortBy?: string;
}

export interface ProductPayload {
  id_danh_muc: number | string;
  ten_san_pham: string;
  gia: number | string;
  ton_kho?: number | string;
  ton_kho_toi_thieu?: number | string;
  don_vi_tinh?: string;
  mo_ta?: string;
  cong_dung?: string;
  huong_dan_su_dung?: string;
  han_su_dung?: string;
  xuat_xu?: string;
  trang_thai?: ProductStatus;
  images?: FileList | File[];
  id_kho_hang?: number | string;
  so_luong_kho?: number | string;
}

const toProductFormData = (payload: Partial<ProductPayload>) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (
      key === "images" ||
      key === "id_kho_hang" ||
      key === "so_luong_kho" ||
      key === "ton_kho" ||
      key === "ton_kho_toi_thieu" ||
      value === undefined ||
      value === null
    ) {
      return;
    }
    formData.append(key, String(value));
  });

  const images = payload.images;
  if (images) {
    Array.from(images).forEach((file) => {
      formData.append("images", file);
    });
  }

  return formData;
};

export const getProducts = async (params?: ProductListParams) => {
  const response = await api.get("/products", { params });
  return response.data;
};

export const getProductById = async (id: string | number) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const productService = {
  getProducts,
  getProductById,

  getAdminProducts: async (params?: ProductListParams) => {
    const response = await api.get("/products/admin", { params });
    return response.data;
  },

  createProduct: async (payload: ProductPayload) => {
    const response = await api.post("/products", toProductFormData(payload));
    return response.data;
  },

  updateProduct: async (id: number | string, payload: Partial<ProductPayload>) => {
    const response = await api.put(`/products/${id}`, toProductFormData(payload));
    return response.data;
  },

  deleteProduct: async (id: number | string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};
