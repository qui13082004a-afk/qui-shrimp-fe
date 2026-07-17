import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ShieldCheck, Truck, Lock } from "lucide-react";
import { confirmDialog } from "../../../utils/notify";
import "./CartPage.css";

interface CartItem {
  id_san_pham: number;
  ten_san_pham: string;
  gia: number;
  hinh_anh: string;
  so_luong: number;
}

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // 1. Đọc dữ liệu giỏ hàng từ localStorage khi vừa vào trang
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(storedCart);
  }, []);

  // Hàm cập nhật trạng thái State đồng thời lưu đè vào localStorage
  const updateCart = (newCart: CartItem[]) => {
    setCartItems(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    // Phát tín hiệu thông báo cho Header cập nhật số lượng Badge trên giỏ hàng lập tức
    window.dispatchEvent(new Event("storage"));
  };

  // 2. Tăng / Giảm số lượng vật tư
  const handleQuantityChange = (id: number, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.id_san_pham === id) {
        const nextQty = item.so_luong + delta;
        return { ...item, so_luong: nextQty < 1 ? 1 : nextQty };
      }
      return item;
    });
    updateCart(updated);
  };

  // 3. Xóa sản phẩm ra khỏi giỏ
  const handleRemoveItem = async (id: number) => {
    const confirmed = await confirmDialog("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?");
    if (!confirmed) return;

    const filtered = cartItems.filter((item) => item.id_san_pham !== id);
    updateCart(filtered);
  };

  // 4. Các hàm tính toán số liệu tài chính công khai
  const subtotal = cartItems.reduce((acc, item) => acc + item.gia * item.so_luong, 0);
  const totalItems = cartItems.reduce((acc, item) => acc + item.so_luong, 0);
  const finalTotal = Math.max(0, subtotal );

  // Giao diện khi giỏ hàng trống không có hàng
  if (cartItems.length === 0) {
    return (
      <div className="cart-empty-state">
        <p>Giỏ hàng của bạn đang trống.</p>
        <button onClick={() => navigate("/store")}>Quay lại cửa hàng mua sắm</button>
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      {/* Khối tiêu đề đầu trang */}
      <div className="cart-header-title">
        <h1>Giỏ hàng của bạn</h1>
        <p>Chào mừng bạn trở lại! Bạn đang có <span className="highlight-count">{totalItems}</span> sản phẩm trong giỏ hàng.</p>
      </div>

      <div className="cart-main-layout">
        {/* KHỐI TRÁI: DANH SÁCH SẢN PHẨM & CAM KẾT */}
        <div className="cart-left-section">
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div className="cart-item-card" key={item.id_san_pham}>
                <div className="item-card__image">
                  <img src={item.hinh_anh} alt={item.ten_san_pham} />
                </div>
                
                <div className="item-card__info">
                  <h3>{item.ten_san_pham}</h3>
                  <p className="item-card__badge">Sản phẩm chính hãng</p>
                  <div className="item-card__price-row">
                    <span className="price-current">{item.gia.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>

                {/* KHỐI NÚT HÀNH ĐỘNG ĐÃ CĂN CHỈNH GIỮA */}
                <div className="item-card__actions">
                  <div className="cart-qty-controls">
                    <button onClick={() => handleQuantityChange(item.id_san_pham, -1)}>-</button>
                    <input type="text" value={item.so_luong} readOnly />
                    <button onClick={() => handleQuantityChange(item.id_san_pham, 1)}>+</button>
                  </div>
                  
                  <button className="cart-btn-remove" onClick={() => handleRemoveItem(item.id_san_pham)}>
                    <Trash2 size={15} /> Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 3 Khối cam kết thương hiệu ở phía dưới */}
          <div className="cart-trust-badges">
            <div className="trust-badge-card">
              <ShieldCheck size={28} className="badge-icon" />
              <div>
                <h4>Hàng chính hãng</h4>
                <p>Cam kết chất lượng 100%</p>
              </div>
            </div>
            <div className="trust-badge-card">
              <Truck size={28} className="badge-icon" />
              <div>
                <h4>Giao hàng nhanh</h4>
                <p>Hỗ trợ vận chuyển tận ao</p>
              </div>
            </div>
            <div className="trust-badge-card">
              <Lock size={28} className="badge-icon" />
              <div>
                <h4>Bảo mật thông tin</h4>
                <p>Thanh toán an toàn tuyệt đối</p>
              </div>
            </div>
          </div>
        </div>

        {/* KHỐI PHẢI: TÓM TẮT ĐƠN HÀNG */}
        <div className="cart-right-section">
          <div className="checkout-summary-card">
            <h3>Tóm tắt đơn hàng</h3>
            
            <div className="summary-row">
              <span>Tạm tính</span>
              <span>{subtotal.toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <span className="free-shipping">Miễn phí</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row total-row">
              <span>Tổng cộng</span>
              <span className="total-price">{finalTotal.toLocaleString("vi-VN")}đ</span>
            </div>

   

            {/* Nút tiến hành thanh toán chính */}
            <button className="btn-proceed-checkout" onClick={() => navigate("/checkout")}>
              Tiến hành thanh toán <span className="arrow-icon">→</span>
            </button>

            <p className="technical-support-text">
              ℹ Hỗ trợ kỹ thuật 24/7 qua hotline 1900 xxxx
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
