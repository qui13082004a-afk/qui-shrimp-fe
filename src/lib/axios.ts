import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Khi gửi FormData (ví dụ upload ảnh CCCD, biên lai...), KHÔNG được giữ
  // Content-Type: application/json mặc định của instance. Phải xóa để
  // trình duyệt tự set "multipart/form-data; boundary=..." đúng chuẩn,
  // nếu không backend sẽ nhận sai định dạng và các trường File sẽ rỗng.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

export default api;
