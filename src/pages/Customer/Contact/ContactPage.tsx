import {
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";

import "./ContactPage.css";

const contactItems = [
  {
    icon: <Phone size={22} />,
    label: "Hotline",
    value: "0901 234 567",
    text: "Hỗ trợ tư vấn sản phẩm, đơn hàng và giao hàng.",
  },
  {
    icon: <Mail size={22} />,
    label: "Email",
    value: "hotro@nhanong.id.vn",
    text: "Tiếp nhận yêu cầu hỗ trợ và phản hồi nghiệp vụ.",
  },
  {
    icon: <MapPin size={22} />,
    label: "Khu vực phục vụ",
    value: "Miền Tây",
    text: "Tùy theo cấu hình khu vực kinh doanh và khu vực trả sau.",
  },
];

const ContactPage = () => {
  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div>
          <span className="contact-eyebrow">
            <MessageCircle size={18} />
            Liên hệ Nhà Nông
          </span>
          <h1>Cần hỗ trợ về đơn hàng, ao nuôi hoặc mua trả sau?</h1>
          <p>
            Gửi thông tin liên hệ cho đội ngũ Nhà Nông. Chúng tôi sẽ hỗ trợ theo
            đúng khu vực, đơn hàng và hồ sơ của khách hàng.
          </p>
        </div>

        <div className="contact-hero__note">
          <ShieldCheck size={30} />
          <strong>Thông tin được dùng để hỗ trợ vận hành</strong>
          <span>Không thay thế quy trình tạo đơn, thanh toán hoặc duyệt hồ sơ trong hệ thống.</span>
        </div>
      </section>

      <section className="contact-layout">
        <div className="contact-info-list">
          {contactItems.map((item) => (
            <article className="contact-info-card" key={item.label}>
              <div>{item.icon}</div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.text}</p>
            </article>
          ))}

          <article className="contact-hours">
            <Clock3 size={22} />
            <div>
              <strong>Thời gian hỗ trợ</strong>
              <p>Thứ 2 - Thứ 7, 07:30 - 17:30</p>
            </div>
          </article>
        </div>

        <form className="contact-form">
          <div className="contact-form__head">
            <span>Gửi lời nhắn</span>
            <h2>Thông tin liên hệ</h2>
            <p>Form này phục vụ giao diện liên hệ, chưa thay đổi API hoặc nghiệp vụ backend.</p>
          </div>

          <div className="contact-form__grid">
            <label>
              Họ tên
              <input type="text" placeholder="Nguyễn Văn A" />
            </label>
            <label>
              Số điện thoại
              <input type="tel" placeholder="0901234567" />
            </label>
          </div>

          <label>
            Email
            <input type="email" placeholder="email@example.com" />
          </label>

          <label>
            Nội dung cần hỗ trợ
            <textarea rows={5} placeholder="Nhập nội dung cần Nhà Nông hỗ trợ..." />
          </label>

          <button type="button" className="contact-submit">
            <Send size={18} />
            Gửi thông tin
          </button>
        </form>
      </section>
    </div>
  );
};

export default ContactPage;
