import React from "react";
import { useNavigate } from "react-router-dom";
import "./OrderSuccessPage.css";

const OrderSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="order-success-page">
      <div className="order-success-card">
        <div className="success-icon">
          <i className="fa-solid fa-check"></i>
        </div>

        <h1>Cảm ơn bạn đã đặt hàng</h1>

        <p>
          Đơn hàng của bạn đã được ghi nhận thành công. Nhân viên sẽ sớm xác nhận
          và tiến hành giao hàng trong thời gian sớm nhất.
        </p>

        <div className="success-info">
          <div>
            <span>Phương thức thanh toán</span>
            <strong>Thanh toán khi nhận hàng</strong>
          </div>

          <div>
            <span>Trạng thái đơn hàng</span>
            <strong>Chờ xác nhận</strong>
          </div>
        </div>

        <div className="success-actions">
          <button onClick={() => navigate("/orders")}>
            Xem đơn hàng của tôi
          </button>

          <button onClick={() => navigate("/store")} className="secondary">
            Tiếp tục mua hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;