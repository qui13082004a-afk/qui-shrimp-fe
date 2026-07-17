import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { toastSuccess } from "../../utils/notify";
import "./ResetPasswordCodePage.css";

export default function ResetPasswordCodePage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(300);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("resetEmail");

    if (!savedEmail) {
      navigate("/forgot-password");
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

  const handleNext = () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setMessage("Vui lòng nhập đủ 6 số OTP");
      return;
    }

    localStorage.setItem("resetOtp", otpCode);
    navigate("/reset-new-password");
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await authService.forgotPassword({ email });

      toastSuccess(res.data.message || "Đã gửi lại mã OTP");
      setTimeLeft(300);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Gửi lại mã thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-code-page">
      <div className="reset-code-card">
        <h1>NHÀ NÔNG</h1>
        <div className="reset-code-line"></div>

        <h2>Xác thực Email</h2>

        <p className="reset-code-desc">
          Vui lòng nhập mã OTP 6 chữ số đã được gửi đến email{" "}
          <span>{maskEmail(email)}</span>
        </p>

        <div className="reset-code-otp-list">
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

        {message && <p className="reset-code-message">{message}</p>}

        <button className="reset-code-btn" onClick={handleNext}>
          Tiếp tục
          <ArrowRight size={22} />
        </button>

        <div className="reset-code-resend">
          {timeLeft > 0 ? (
            <p>
              <Clock size={18} />
              Gửi lại mã sau <b>{formatTime(timeLeft)}</b>
            </p>
          ) : (
            <button onClick={handleResendOtp} disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi lại mã"}
            </button>
          )}
        </div>

        <div className="reset-code-bottom-line"></div>

        <button
          className="reset-code-back"
          onClick={() => navigate("/forgot-password")}
        >
          <ArrowLeft size={20} />
          Quay lại quên mật khẩu
        </button>
      </div>

      <p className="reset-code-footer">
        © 2026 NHÀ NÔNG - Hệ thống quản lý nuôi tôm thông minh
      </p>
    </div>
  );
}
