import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react"; // Import icon cho trực quan
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="customer-footer">
      <div className="customer-footer__inner">
        {/* Khối 1: Giới thiệu thương hiệu */}
        <div className="footer-section brand-info">
          <h2>NHÀ NÔNG</h2>
          <p>
            Nền tảng cung cấp sản phẩm nuôi tôm, hỗ trợ quản lý ao nuôi,
            đơn hàng và công nợ toàn diện cho người nuôi thủy sản Việt Nam.
          </p>
        </div>

        {/* Khối 2: Liên kết nhanh (Chuyển thành Link để click chuyển trang mượt mà) */}
        <div className="footer-section links-info">
          <h4>Liên kết nhanh</h4>
          <div className="links-grid">
            <Link to="/home">Trang chủ</Link>
            <Link to="/store">Cửa hàng</Link>
            <Link to="/ponds">Ao nuôi</Link>
            <Link to="/orders">Công nợ</Link>
          </div>
        </div>

        {/* Khối 3: Thông tin liên hệ có chèn Icon chuyên nghiệp */}
        <div className="footer-section support-info">
          <h4>Tổng đài hỗ trợ</h4>
          <div className="contact-item">
            <Mail size={16} />
            <span>hotro@nhanong.id.vn</span>
          </div>
          <div className="contact-item">
            <Phone size={16} />
            <strong>0901 234 567</strong>
          </div>
          <div className="contact-item">
            <MapPin size={16} />
            <span>Khu vực: Bến Tre, Tiền Giang, Long An</span>
          </div>
        </div>
      </div>

      {/* Phần bản quyền dưới cùng */}
      <div className="customer-footer__bottom">
        <div className="footer-bottom-content">
          <span>© 2026 NHÀ NÔNG. Hệ thống hỗ trợ nuôi tôm công nghệ mới.</span>
          <span className="footer-version">Phiên bản 1.0.0</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;