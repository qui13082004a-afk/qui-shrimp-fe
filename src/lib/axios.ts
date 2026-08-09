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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const authCodes = [
      "TOKEN_EXPIRED",
      "INVALID_TOKEN",
      "INVALID_TOKEN_TYPE",
      "ACCOUNT_NOT_FOUND",
      "ACCOUNT_LOCKED",
    ];

    if ((status === 401 || status === 403) && authCodes.includes(code)) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = `/login?reason=${code}&from=${encodeURIComponent(
          currentPath
        )}`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
