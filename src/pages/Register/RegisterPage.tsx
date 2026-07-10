import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Droplet,
  Eye,
  Home,
  Lock,
  Mail,
  MapPin,
  Network,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { authService } from "../../services/auth.service";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");
  const [tinhThanh, setTinhThanh] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (matKhau !== xacNhanMatKhau) {
      setErrorMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const res = await authService.register({
        ho_ten: hoTen,
        so_dien_thoai: soDienThoai,
        dia_chi: diaChi,
        email,
        mat_khau: matKhau,
        tinh_thanh: tinhThanh,
      });

      localStorage.setItem("verifyEmail", email);

      alert(
        res.data.message ||
          "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP."
      );

      navigate("/verify-email");
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-bg"></div>

      <div className="register-wrapper">
        <div className="register-left">
          <div>
            <h1>
              <Droplet size={34} fill="white" />
             Nhà Nông
            </h1>

            <p className="left-desc">
              Giải pháp quản lý và cung ứng vật tư nuôi tôm hiện đại, đồng hành
              cùng người nuôi trong từng vụ nuôi thành công.
            </p>
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3>Quản lý thông minh</h3>
                <p>Theo dõi ao nuôi, vụ nuôi, đơn hàng và công nợ dễ dàng.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Network size={24} />
              </div>
              <div>
                <h3>Kết nối vật tư</h3>
                <p>Cung ứng thức ăn, thuốc, khoáng và sản phẩm thủy sản.</p>
              </div>
            </div>
          </div>

          <div className="left-footer">
            © 2026 NHÀ NÔNG. Bản quyền thuộc về NHÀ NÔNG.
          </div>
        </div>

        <div className="register-right">
          <div className="register-form-box">
            <h2>Bắt đầu ngay</h2>
            <p className="form-desc">
              Tạo tài khoản để sử dụng hệ thống quản lý nuôi tôm.
            </p>

            <div className="short-line"></div>

            <form onSubmit={handleRegister}>
              <div className="form-grid">
                <div className="form-group">
                  <label>HỌ VÀ TÊN</label>
                  <div className="input-box">
                    <User size={18} />
                    <input
                      value={hoTen}
                      onChange={(e) => setHoTen(e.target.value)}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>SỐ ĐIỆN THOẠI</label>
                  <div className="input-box">
                    <Phone size={18} />
                    <input
                      value={soDienThoai}
                      onChange={(e) => setSoDienThoai(e.target.value)}
                      placeholder="0901234567"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>ĐỊA CHỈ</label>
                <div className="input-box">
                  <Home size={18} />
                  <input
                    value={diaChi}
                    onChange={(e) => setDiaChi(e.target.value)}
                    placeholder="Nhập địa chỉ của bạn"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>EMAIL</label>
                <div className="input-box">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nguyenvan@email.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>KHU VỰC NUÔI</label>
                <div className="input-box">
                  <MapPin size={18} />
                  <select
                    value={tinhThanh}
                    onChange={(e) => setTinhThanh(e.target.value)}
                  >
                    <option value="">Chọn Tỉnh / Thành phố</option>
                    <option value="Tiền Giang">Tiền Giang</option>
                    <option value="Bến Tre">Bến Tre</option>
                    <option value="Long An">Long An</option>
                  </select>
                  <ChevronDown className="select-icon" size={20} />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>MẬT KHẨU</label>
                  <div className="input-box">
                    <Lock size={18} />
                    <input
                      type="password"
                      value={matKhau}
                      onChange={(e) => setMatKhau(e.target.value)}
                      placeholder="••••••••"
                    />
                    <Eye size={18} />
                  </div>
                </div>

                <div className="form-group">
                  <label>XÁC NHẬN MẬT KHẨU</label>
                  <div className="input-box">
                    <Shield size={18} />
                    <input
                      type="password"
                      value={xacNhanMatKhau}
                      onChange={(e) => setXacNhanMatKhau(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {errorMessage && <p className="error-message">{errorMessage}</p>}

              <button disabled={loading} type="submit" className="register-btn">
                {loading ? "Đang đăng ký..." : "Đăng ký ngay"}
                <ArrowRight size={20} />
              </button>

              <p className="note">* Mã OTP sẽ được gửi qua email này</p>
            </form>

            <div className="bottom-line"></div>

            <p className="login-link">
              Đã có tài khoản? <a href="/login">Đăng nhập</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}