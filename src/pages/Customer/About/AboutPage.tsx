import {
  BadgeCheck,
  Handshake,
  MapPinned,
  PackageCheck,
  ShieldCheck,
  Sprout,
  Truck,
  Waves,
} from "lucide-react";

import "./AboutPage.css";

const values = [
  {
    icon: <PackageCheck size={24} />,
    title: "Vật tư đúng nhu cầu",
    text: "Tập trung vào thức ăn, chế phẩm sinh học, khoáng chất và nhóm sản phẩm phục vụ ao nuôi.",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Mua trả sau có kiểm soát",
    text: "Hồ sơ được thẩm định theo ao nuôi, vụ nuôi, khu vực hỗ trợ và chính sách hạn mức.",
  },
  {
    icon: <Truck size={24} />,
    title: "Giao hàng theo khu vực",
    text: "Đơn hàng được điều phối theo kho, tồn kho và khoảng cách giao hàng thực tế.",
  },
];

const milestones = [
  "Khách hàng tạo tài khoản và xác thực email.",
  "Cập nhật ao nuôi, vụ nuôi và địa chỉ giao hàng.",
  "Đặt mua vật tư hoặc đăng ký mua trả sau.",
  "Theo dõi đơn hàng, giao hàng, công nợ và thông báo.",
];

const AboutPage = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero__content">
          <span className="about-eyebrow">
            <Sprout size={18} />
            Về Nhà Nông
          </span>
          <h1>Hệ thống hỗ trợ người nuôi tôm mua vật tư và quản lý vụ nuôi rõ ràng hơn.</h1>
          <p>
            Nhà Nông được xây dựng cho mô hình kinh doanh vật tư nuôi tôm, kết nối
            khách hàng, kho hàng, hạn mức trả sau và giao hàng trong cùng một luồng xử lý.
          </p>
        </div>

        <div className="about-hero__card">
          <Waves size={34} />
          <strong>Đồng hành cùng từng vụ nuôi</strong>
          <span>Từ lúc thả giống, mua vật tư đến khi theo dõi công nợ và giao hàng.</span>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section__heading">
          <span>Giá trị cốt lõi</span>
          <h2>Thiết kế cho nghiệp vụ thực tế của người nuôi tôm</h2>
        </div>

        <div className="about-value-grid">
          {values.map((item) => (
            <article className="about-value-card" key={item.title}>
              <div>{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-story">
        <article>
          <span>Luồng vận hành</span>
          <h2>Một hệ thống, nhiều nghiệp vụ liên kết</h2>
          <p>
            Thay vì quản lý rời rạc giữa ao nuôi, đơn hàng, giao hàng và công nợ,
            hệ thống gom dữ liệu về một nơi để khách hàng và nhân viên theo dõi
            đúng trạng thái ở từng bước.
          </p>
        </article>

        <div className="about-timeline">
          {milestones.map((item, index) => (
            <div className="about-timeline__item" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-commitment">
        <div>
          <BadgeCheck size={24} />
          <h3>Minh bạch dữ liệu</h3>
          <p>Đơn hàng, phí vận chuyển, công nợ và thông báo được cập nhật theo từng vai trò.</p>
        </div>
        <div>
          <MapPinned size={24} />
          <h3>Theo khu vực phục vụ</h3>
          <p>Khu vực kinh doanh, trả sau và giao hàng được cấu hình để tránh hardcode nghiệp vụ.</p>
        </div>
        <div>
          <Handshake size={24} />
          <h3>Hỗ trợ lâu dài</h3>
          <p>Hệ thống hướng tới việc đồng hành với khách hàng trong suốt vòng đời vụ nuôi.</p>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
