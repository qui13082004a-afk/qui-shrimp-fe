import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Headphones, Lock, Mail, XCircle } from "lucide-react";
import { authService } from "../../services/auth.service";
import "./LoginPage.css";

type LoginNotice = {
  type: "success" | "error";
  message: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState<LoginNotice | null>(null);
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const getRedirectPath = (role?: string) => {
    if (role === "admin") {
      return "/admin";
    }

    if (role === "nhan_vien_dinh_muc") {
      return "/nhan-vien-dinh-muc/ho-so-tham-dinh";
    }

    if (role === "nhan_vien_giao_hang") {
      return "/delivery";
    }

    return "/home";
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");
      setNotice(null);

      const res = await authService.login({
        email,
        mat_khau: matKhau,
      });

      const token = res.data.data.token;
      const user = res.data.data.user;

      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(user));

      setNotice({
        type: "success",
        message: res.data.message || "Đăng nhập thành công. Đang chuyển trang...",
      });

      redirectTimerRef.current = window.setTimeout(() => {
        window.location.href = getRedirectPath(user.vai_tro);
      }, 700);
    } catch (error: any) {
      const message = error.response?.data?.message || "Đăng nhập thất bại";
      setErrorMessage(message);
      setNotice({
        type: "error",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {notice && (
        <div className={`login-notice login-notice--${notice.type}`} role="status">
          {notice.type === "success" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span>{notice.message}</span>
        </div>
      )}

      <div className="login-card">
        <div className="login-left">
          <img src="/shrimp-farm.jpg" alt="Ao nuôi tôm" />

          <div className="login-overlay"></div>

          <div className="login-brand">
            <h1>NHÀ NÔNG</h1>
            <p>
              Giải pháp quản lý và cung ứng vật tư nuôi tôm hiện đại. Đồng hành
              cùng người nuôi tôm trong từng vụ nuôi thành công.
            </p>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-box">
            <h2>Đăng nhập tài khoản</h2>

            <p className="desc">
              Chào mừng bạn quay trở lại với hệ thống quản lý nuôi tôm NHÀ NÔNG.
            </p>

            <form onSubmit={handleLogin}>
              <label>Email</label>
              <div className="input-box">
                <Mail size={20} />
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <label>Mật khẩu</label>
              <div className="input-box">
                <Lock size={22} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                />
              </div>

              <div className="form-row">
                <label className="remember">
                  <input type="checkbox" />
                  Duy trì đăng nhập
                </label>

                <a href="/forgot-password">Quên mật khẩu?</a>
              </div>

              {errorMessage && <p className="error-message">{errorMessage}</p>}

              <button className="login-submit-button" type="submit" disabled={loading}>
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <div className="line"></div>

            <p className="register-text">
              Chưa có tài khoản? <a href="/register">Đăng ký tài khoản mới</a>
            </p>

            <p className="support">
              <Headphones size={16} />
              Cần hỗ trợ?
            </p>

            <p className="copyright">© 2026 NHÀ NÔNG. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
