import { useLocation, useNavigate } from "react-router-dom";
import "./AccessRequiredCard.css";

export default function AccessRequiredCard() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    navigate("/login", {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  return (
    <div className="access-required-card">
      <h2>Yêu cầu quyền truy cập</h2>
      <button
        type="button"
        onClick={handleLogin}
        className="access-required-card__button"
      >
        Đăng nhập ngay
      </button>
    </div>
  );
}
