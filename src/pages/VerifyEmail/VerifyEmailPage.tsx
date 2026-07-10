import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import "./VerifyEmailPage.css";

export default function VerifyEmailPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(300);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("verifyEmail");

    if (!savedEmail) {
      navigate("/register");
      return;
    }

    setEmail(savedEmail);
  }, [navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const maskEmail = (value: string) => {
    const [name, domain] = value.split("@");
    if (!name || !domain) return value;
    return `${name.slice(0, 1)}***@${domain}`;
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setMessage("Vui lòng nhập đủ 6 số OTP");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await authService.verifyEmail({
        email,
        otp_code: otpCode,
      });

      alert(res.data.message || "Xác thực email thành công");

      localStorage.removeItem("verifyEmail");
      navigate("/login");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Xác thực thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setMessage("");

      const res = await authService.resendOtp({ email });

      alert(res.data.message || "Đã gửi lại mã OTP");
      setTimeLeft(300);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Gửi lại mã thất bại");
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-card">
        <h1>ĐẤT TÔM</h1>
        <div className="verify-line"></div>

        <h2>Xác thực Email</h2>

        <p className="verify-desc">
          Vui lòng nhập mã OTP 6 chữ số đã được gửi đến email của bạn{" "}
          <span>{maskEmail(email)}</span>
        </p>

        <div className="otp-list">
          {otp.map((item, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              value={item}
              maxLength={1}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>

        {message && <p className="verify-message">{message}</p>}

        <button className="verify-btn" onClick={handleVerify} disabled={loading}>
          {loading ? "Đang xác nhận..." : "Xác nhận"}
          <ArrowRight size={22} />
        </button>

        <div className="resend-box">
          {timeLeft > 0 ? (
            <p>
              <Clock size={18} />
              Gửi lại mã sau <b>{formatTime(timeLeft)}</b>
            </p>
          ) : (
            <button onClick={handleResendOtp}>Gửi lại mã</button>
          )}
        </div>

        <div className="verify-bottom-line"></div>

        <button className="back-btn" onClick={() => navigate("/register")}>
          <ArrowLeft size={20} />
          Quay lại màn hình đăng ký
        </button>
      </div>

      <p className="verify-footer">
        © 2026 ĐẤT TÔM - Hệ thống quản lý nuôi tôm thông minh
      </p>
    </div>
  );
}