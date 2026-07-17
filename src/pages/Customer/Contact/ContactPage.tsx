import {
  ArrowRight,
  Clock3,
  ExternalLink,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";

import "./ContactPage.css";

const ZALO_PHONE = "0901234567";
const DISPLAY_PHONE = "0901 234 567";
const SUPPORT_EMAIL = "hotro@nhanong.id.vn";
const ZALO_URL = `https://zalo.me/${ZALO_PHONE}`;

const contactMethods = [
  {
    icon: <MessageCircle size={22} />,
    title: "Zalo",
    value: DISPLAY_PHONE,
    description: "Nhanh nhất cho đơn hàng, giao hàng, công nợ và hồ sơ trả sau.",
    href: ZALO_URL,
    action: "Nhắn Zalo",
    primary: true,
  },
  {
    icon: <Phone size={22} />,
    title: "Hotline",
    value: DISPLAY_PHONE,
    description: "Dùng khi cần trao đổi gấp với bộ phận vận hành.",
    href: `tel:${ZALO_PHONE}`,
    action: "Gọi ngay",
  },
  {
    icon: <Mail size={22} />,
    title: "Email",
    value: SUPPORT_EMAIL,
    description: "Phù hợp khi cần gửi chứng từ hoặc nội dung dài.",
    href: `mailto:${SUPPORT_EMAIL}`,
    action: "Gửi email",
  },
];

const supportScopes = [
  "Tư vấn vật tư nuôi tôm",
  "Hỗ trợ đơn hàng và giao hàng",
  "Tra cứu công nợ và hồ sơ trả sau",
  "Tiếp nhận chứng từ thanh toán",
];

export default function ContactPage() {
  return (
    <main className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero__main">
          <span className="contact-eyebrow">
            <Headphones size={18} />
            Trung tâm hỗ trợ
          </span>

          <h1>Liên hệ Nhà Nông qua Zalo</h1>

          <p>
            Không cần điền biểu mẫu. Chọn kênh bên dưới để kết nối trực tiếp với
            Nhà Nông khi cần hỗ trợ về vật tư, ao nuôi, đơn hàng hoặc công nợ.
          </p>

          <div className="contact-hero__actions">
            <a className="contact-primary-action" href={ZALO_URL} target="_blank" rel="noreferrer">
              <MessageCircle size={20} />
              Nhắn Zalo ngay
              <ExternalLink size={16} />
            </a>

            <a className="contact-secondary-action" href={`tel:${ZALO_PHONE}`}>
              <Phone size={18} />
              Gọi hotline
            </a>
          </div>
        </div>

        <aside className="contact-focus-card">
          <div className="contact-focus-card__icon">
            <MessageCircle size={30} />
          </div>

          <span>Kênh ưu tiên</span>
          <strong>{DISPLAY_PHONE}</strong>
          <p>
            Gửi mã đơn hàng, ảnh chứng từ hoặc thông tin ao nuôi qua Zalo để
            nhân viên hỗ trợ nhanh hơn.
          </p>

          <a href={ZALO_URL} target="_blank" rel="noreferrer">
            Mở Zalo
            <ArrowRight size={17} />
          </a>
        </aside>
      </section>

      <section className="contact-methods">
        {contactMethods.map((method) => (
          <article
            className={`contact-method ${method.primary ? "contact-method--primary" : ""}`}
            key={method.title}
          >
            <div className="contact-method__icon">{method.icon}</div>
            <div>
              <span>{method.title}</span>
              <strong>{method.value}</strong>
              <p>{method.description}</p>
            </div>
            <a
              href={method.href}
              target={method.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
            >
              {method.action}
              <ExternalLink size={15} />
            </a>
          </article>
        ))}
      </section>

      <section className="contact-support-panel">
        <div className="contact-support-panel__info">
          <span>Phạm vi hỗ trợ</span>
          <h2>Nhà Nông tiếp nhận các vấn đề nào?</h2>
          <p>
            Kênh liên hệ dùng để tư vấn và hỗ trợ vận hành. Những thao tác như
            đặt hàng, thanh toán, duyệt hồ sơ và cập nhật công nợ vẫn được xử lý
            chính thức trong hệ thống.
          </p>
        </div>

        <div className="contact-support-list">
          {supportScopes.map((item) => (
            <div key={item}>
              <ShieldCheck size={18} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="contact-meta">
        <div>
          <Clock3 size={22} />
          <span>Thời gian hỗ trợ</span>
          <strong>Thứ 2 - Thứ 7, 07:30 - 17:30</strong>
        </div>

        <div>
          <MapPin size={22} />
          <span>Khu vực vận hành</span>
          <strong>Theo khu vực bán hàng Admin cấu hình</strong>
        </div>
      </section>
    </main>
  );
}
