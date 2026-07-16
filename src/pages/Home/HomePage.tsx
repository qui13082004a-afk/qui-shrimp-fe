import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  LayoutDashboard,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Waves,
} from "lucide-react";
import { Link } from "react-router-dom";

import "./HomePage.css";

const strengths = [
  {
    icon: <ShoppingBag size={22} />,
    title: "Mua vật tư nuôi tôm",
    text: "Tìm thức ăn, men vi sinh, khoáng chất và vật tư theo danh mục rõ ràng.",
  },
  {
    icon: <CreditCard size={22} />,
    title: "Mua trả sau theo hồ sơ",
    text: "Khách hàng đủ điều kiện có thể đăng ký hạn mức công nợ theo vụ nuôi.",
  },
  {
    icon: <MapPin size={22} />,
    title: "Khu vực và phí vận chuyển",
    text: "Hệ thống tính phí theo kho, địa chỉ giao hàng và khu vực phục vụ.",
  },
  {
    icon: <LayoutDashboard size={22} />,
    title: "Dashboard khách hàng",
    text: "Theo dõi ao nuôi, vụ nuôi, đơn hàng, công nợ và thông báo trong một nơi.",
  },
];

const steps = [
  "Tạo tài khoản và xác thực email",
  "Quản lý ao nuôi, vụ nuôi",
  "Chọn sản phẩm và đặt hàng",
  "Theo dõi giao hàng, công nợ",
];

const HomePage = () => {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__overlay" />

        <header className="home-header">
          <Link className="home-header__brand" to="/">
            NHÀ NÔNG
          </Link>

          <nav className="home-header__nav" aria-label="Điều hướng trang chủ">
            <a href="#features">Chức năng</a>
            <a href="#workflow">Quy trình</a>
            <a href="#trust">Vận hành</a>
            <Link to="/about">Giới thiệu</Link>
            <Link to="/contact">Liên hệ</Link>
          </nav>

          <div className="home-header__actions">
            <Link className="home-btn home-btn--ghost" to="/login">
              Đăng nhập
            </Link>
            <Link className="home-btn home-btn--solid" to="/register">
              Đăng ký
            </Link>
          </div>
        </header>

        <div className="home-hero__content">
          <span className="home-eyebrow">
            <Waves size={18} />
            Hệ thống vật tư nuôi tôm
          </span>

          <h1>Quản lý mua hàng, ao nuôi và công nợ trong một hệ thống.</h1>

          <p>
            Nhà Nông hỗ trợ người nuôi tôm mua vật tư, theo dõi vụ nuôi,
            đăng ký mua trả sau và nhận giao hàng theo khu vực phục vụ.
          </p>

          <div className="home-hero__buttons">
            <Link className="home-cta home-cta--primary" to="/register">
              Bắt đầu đăng ký
              <ArrowRight size={18} />
            </Link>
            <Link className="home-cta home-cta--secondary" to="/login">
              Vào dashboard khách hàng
            </Link>
          </div>
        </div>

        <div className="home-hero__metrics" aria-label="Tổng quan hệ thống">
          <div>
            <strong>Đa kho</strong>
            <span>Điều phối tồn kho theo điểm xuất hàng</span>
          </div>
          <div>
            <strong>Trả sau</strong>
            <span>Thẩm định hồ sơ và hạn mức theo vụ nuôi</span>
          </div>
          <div>
            <strong>Giao hàng</strong>
            <span>Theo dõi trạng thái và chứng từ giao hàng</span>
          </div>
        </div>
      </section>

      <section className="home-section home-section--intro">
        <div className="home-section__heading">
          <span>Giải pháp vận hành</span>
          <h2>Một luồng mua vật tư rõ ràng cho người nuôi tôm</h2>
        </div>

        <div className="home-intro-grid">
          <article className="home-intro-card">
            <PackageCheck size={28} />
            <h3>Sản phẩm và tồn kho theo kho</h3>
            <p>
              Sản phẩm được quản lý thống nhất, tồn kho được theo dõi riêng tại
              từng kho để phục vụ điều phối đơn hàng.
            </p>
          </article>

          <article className="home-intro-card">
            <ShieldCheck size={28} />
            <h3>Hồ sơ trả sau có kiểm soát</h3>
            <p>
              Hồ sơ được thẩm định theo khu vực, vụ nuôi và chính sách hạn mức
              trước khi khách hàng được mua trả sau.
            </p>
          </article>

          <article className="home-intro-card">
            <Truck size={28} />
            <h3>Giao hàng theo khu vực</h3>
            <p>
              Đơn hàng có thể được phân công cho nhân viên giao hàng, cập nhật
              trạng thái và lưu ảnh chứng từ sau khi giao.
            </p>
          </article>
        </div>
      </section>

      <section className="home-section" id="features">
        <div className="home-section__heading">
          <span>Chức năng chính</span>
          <h2>Dành cho khách hàng nuôi tôm</h2>
        </div>

        <div className="home-feature-grid">
          {strengths.map((item) => (
            <article className="home-feature-card" key={item.title}>
              <div className="home-feature-card__icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-workflow" id="workflow">
        <div className="home-section__heading">
          <span>Quy trình sử dụng</span>
          <h2>Từ đăng ký đến theo dõi đơn hàng</h2>
        </div>

        <div className="home-step-list">
          {steps.map((step, index) => (
            <div className="home-step" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section home-trust" id="trust">
        <div>
          <span className="home-eyebrow home-eyebrow--dark">
            <BadgeCheck size={18} />
            Theo dõi minh bạch
          </span>
          <h2>Dữ liệu đơn hàng, công nợ và giao hàng được gom về một hệ thống.</h2>
        </div>

        <Link className="home-cta home-cta--primary" to="/login">
          Đăng nhập để quản lý
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
};

export default HomePage;
