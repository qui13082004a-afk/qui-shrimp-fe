import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, Lock, Waves } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import "./ResetNewPasswordPage.css";

export default function ResetNewPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [matKhauMoi, setMatKhauMoi] = useState("");
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("resetEmail");
    const savedOtp = localStorage.getItem("resetOtp");

    if (!savedEmail || !savedOtp) {
      navigate("/forgot-password");
      return;
    }

    setEmail(savedEmail);
    setOtpCode(savedOtp);
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (matKhauMoi.length < 6) {
      setMessage("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }

    if (matKhauMoi !== xacNhanMatKhau) {
      setMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await authService.resetPassword({
        email,
        otp_code: otpCode,
        mat_khau_moi: matKhauMoi,
      });

      alert(res.data.message || "Đặt lại mật khẩu thành công");

      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetOtp");

      navigate("/login");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-new-page">
      <div className="reset-new-overlay"></div>

      <div className="reset-new-logo">
        <Waves size={26} />
        <span>NHÀ NÔNG</span>
      </div>

      <div className="reset-new-card">
        <h2>Đặt lại mật khẩu</h2>


        <p className="reset-new-desc">
          Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
        </p>

        <form onSubmit={handleResetPassword}>
          <label>MẬT KHẨU MỚI</label>
          <div className="reset-new-input-box">
            <Lock size={20} />
            <input
              type="password"
              placeholder="••••••••"
              value={matKhauMoi}
              onChange={(e) => setMatKhauMoi(e.target.value)}
            />
            <Eye size={20} />
          </div>

          <label>XÁC NHẬN MẬT KHẨU MỚI</label>
          <div className="reset-new-input-box">
            <Lock size={20} />
            <input
              type="password"
              placeholder="••••••••"
              value={xacNhanMatKhau}
              onChange={(e) => setXacNhanMatKhau(e.target.value)}
            />
            <Eye size={20} />
          </div>

          {message && <p className="reset-new-message">{message}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            <ArrowRight size={22} />
          </button>
        </form>

        <div className="reset-new-line"></div>

        <button className="reset-new-back" onClick={() => navigate("/login")}>
          <ArrowLeft size={20} />
          Quay lại đăng nhập
        </button>
      </div>

      <p className="reset-new-footer">
        © 2026 NHÀ NÔNG - Hệ thống quản lý nuôi tôm thông minh
      </p>
    </div>
  );
}