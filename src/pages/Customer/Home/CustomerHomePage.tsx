import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CreditCard,
  LayoutDashboard,
  MapPin,
  PackageSearch,
  ShoppingBag,
  Sprout,
  Waves,
} from "lucide-react";
import { Link } from "react-router-dom";

import "./CustomerHomePage.css";

const quickActions = [
  {
    title: "Mua vật tư",
    text: "Xem sản phẩm theo danh mục và tồn kho từng kho.",
    to: "/store",
    icon: <ShoppingBag size={22} />,
  },
  {
    title: "Quản lý ao nuôi",
    text: "Theo dõi ao, vụ nuôi và lịch sử mua vật tư.",
    to: "/ponds",
    icon: <Waves size={22} />,
  },
  {
    title: "Mua trả sau",
    text: "Kiểm tra hồ sơ, hạn mức và công nợ hiện tại.",
    to: "/debt",
    icon: <CreditCard size={22} />,
  },
  {
    title: "Tổng quan",
    text: "Xem dashboard số liệu ao nuôi, đơn hàng và công nợ.",
    to: "/dashboard",
    icon: <LayoutDashboard size={22} />,
  },
];

const highlights = [
  {
    icon: <PackageSearch size={20} />,
    label: "Sản phẩm theo kho",
    value: "Tồn kho rõ ràng",
  },
  {
    icon: <MapPin size={20} />,
    label: "Giao hàng theo khu vực",
    value: "Tính phí tự động",
  },
  {
    icon: <BadgeCheck size={20} />,
    label: "Trả sau có kiểm soát",
    value: "Theo vụ nuôi",
  },
];

const CustomerHomePage = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const customerName = user?.ho_ten || "khách hàng";

  return (
    <div className="customer-home-page">
      <section className="customer-home-hero">
        <div className="customer-home-hero__content">
          <span className="customer-home-eyebrow">
            <Sprout size={18} />
            Nhà Nông đồng hành cùng vụ nuôi
          </span>

          <h1>Chào {customerName}, hôm nay mình quản lý vụ nuôi gọn hơn nhé.</h1>

          <p>
            Mua vật tư, theo dõi ao nuôi, kiểm tra công nợ và nhận thông báo
            quan trọng trong cùng một hệ thống.
          </p>

          <div className="customer-home-hero__actions">
            <Link className="customer-home-btn customer-home-btn--primary" to="/store">
              Vào cửa hàng
              <ArrowRight size={18} />
            </Link>
            <Link className="customer-home-btn customer-home-btn--secondary" to="/dashboard">
              Xem tổng quan
            </Link>
          </div>
        </div>

        <div className="customer-home-hero__panel">
          <span>Hôm nay nên kiểm tra</span>
          <strong>Ao nuôi, đơn hàng và hạn mức trả sau</strong>
          <p>
            Dashboard chi tiết đã được chuyển sang mục Tổng quan để dễ phân biệt
            với trang chủ.
          </p>
        </div>
      </section>

      <section className="customer-home-section">
        <div className="customer-home-section__head">
          <div>
            <span>Thao tác nhanh</span>
            <h2>Bạn muốn làm gì tiếp theo?</h2>
          </div>
          <Link to="/notifications" className="customer-home-notify-link">
            <Bell size={18} />
            Thông báo
          </Link>
        </div>

        <div className="customer-home-actions">
          {quickActions.map((action) => (
            <Link className="customer-home-action-card" to={action.to} key={action.title}>
              <div className="customer-home-action-card__icon">{action.icon}</div>
              <h3>{action.title}</h3>
              <p>{action.text}</p>
              <span>
                Mở chức năng
                <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="customer-home-grid">
        <article className="customer-home-guide">
          <span>Quy trình gợi ý</span>
          <h2>Theo dõi từ ao nuôi đến đơn hàng</h2>
          <ol>
            <li>Cập nhật thông tin ao và vụ nuôi đang hoạt động.</li>
            <li>Chọn vật tư phù hợp trong cửa hàng.</li>
            <li>Kiểm tra địa chỉ giao hàng và phí vận chuyển.</li>
            <li>Theo dõi đơn hàng, công nợ và thông báo mới.</li>
          </ol>
        </article>

        <aside className="customer-home-highlight">
          {highlights.map((item) => (
            <div className="customer-home-highlight__item" key={item.label}>
              <div>{item.icon}</div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </aside>
      </section>
    </div>
  );
};

export default CustomerHomePage;
