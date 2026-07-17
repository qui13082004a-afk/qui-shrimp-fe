import { useState } from "react";
import { ArrowLeft, ArrowRight, Mail, Waves } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { toastSuccess } from "../../utils/notify";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập email");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const res = await authService.forgotPassword({ email });

      localStorage.setItem("resetEmail", email);

      toastSuccess(
        res.data.message ||
          "Đã gửi mã OTP đặt lại mật khẩu. Vui lòng kiểm tra email."
      );

      navigate("/reset-password-code");
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || "Không gửi được yêu cầu"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-overlay"></div>

      <div className="forgot-card">
        <div className="forgot-icon">
          <Waves size={42} />
        </div>

        <h1>ĐẤT TÔM</h1>

        <h2>Quên mật khẩu</h2>

        <p className="forgot-desc">
          Vui lòng nhập email đã đăng ký để khôi phục mật khẩu.
        </p>

        <form onSubmit={handleForgotPassword}>
          <label>Email</label>

          <div className="forgot-input-box">
            <Mail size={22} />
            <input
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {errorMessage && <p className="forgot-error">{errorMessage}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
            <ArrowRight size={22} />
          </button>
        </form>

        <div className="forgot-line"></div>

        <button className="forgot-back" onClick={() => navigate("/login")}>
          <ArrowLeft size={20} />
          Quay lại đăng nhập
        </button>
      </div>

      <p className="forgot-footer">
        © 2026 ĐẤT TÔM - Hệ thống quản lý nuôi tôm thông minh
      </p>
    </div>
  );
}
