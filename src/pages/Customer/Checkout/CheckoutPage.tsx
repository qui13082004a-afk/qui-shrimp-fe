import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  orderService,
  type PaymentMethod,
} from "../../../services/order.service";
import { paymentService } from "../../../services/payment.service";
import api from "../../../lib/axios";
import "./CheckoutPage.css";

interface CartItem {
  id_san_pham: number;
  ten_san_pham: string;
  gia: number;
  hinh_anh: string;
  so_luong: number;
}

interface StoredUser {
  ho_ten?: string;
  so_dien_thoai?: string;
  dia_chi?: string;
}

interface Pond {
  id_ao: number;
  ten_ao: string;
  dia_chi_ao?: string;
}

interface CropSeason {
  id_vu_nuoi: number;
  id_ao: number;
  ten_vu_nuoi: string;
  trang_thai?: string;
}

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<StoredUser>({});
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("chuyen_khoan");

  const [ponds, setPonds] = useState<Pond[]>([]);
  const [cropSeasons, setCropSeasons] = useState<CropSeason[]>([]);
  const [selectedPondId, setSelectedPondId] = useState<number | "">("");
  const [selectedCropSeasonId, setSelectedCropSeasonId] = useState<number | "">(
    ""
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedCart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    ) as CartItem[];

    const storedUser = JSON.parse(
      localStorage.getItem("user") || "{}"
    ) as StoredUser;

    setCartItems(storedCart);
    setUser(storedUser);
    setAddress(storedUser.dia_chi || "");
    fetchMyPonds();
  }, []);

  useEffect(() => {
    if (!selectedPondId) {
      setCropSeasons([]);
      setSelectedCropSeasonId("");
      return;
    }

    fetchCropSeasonsByPond(selectedPondId);
  }, [selectedPondId]);

  const fetchMyPonds = async () => {
    try {
      const res = await api.get("/ponds/my");
      setPonds(res.data.data || []);
    } catch (error) {
      console.log("GET PONDS ERROR:", error);
    }
  };

  const fetchCropSeasonsByPond = async (pondId: number) => {
    try {
      const res = await api.get(`/crop-seasons/pond/${pondId}`);
      const seasons = res.data.data || [];

      const activeSeasons = seasons.filter(
        (season: CropSeason) => season.trang_thai === "dang_nuoi"
      );

      setCropSeasons(activeSeasons);
    } catch (error) {
      console.log("GET CROP SEASONS ERROR:", error);
      setCropSeasons([]);
    }
  };

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + Number(item.gia) * Number(item.so_luong),
        0
      ),
    [cartItems]
  );

  const shippingFee = 0;
  const total = subtotal + shippingFee;
  const totalItems = cartItems.reduce((acc, item) => acc + item.so_luong, 0);

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      navigate("/cart");
      return;
    }

    if (!address.trim()) {
      setMessage("Vui lòng nhập địa chỉ giao hàng.");
      return;
    }

    if (paymentMethod === "tra_sau") {
      if (!selectedPondId) {
        setMessage("Vui lòng chọn ao nuôi khi mua trả sau.");
        return;
      }

      if (!selectedCropSeasonId) {
        setMessage("Vui lòng chọn vụ nuôi khi mua trả sau.");
        return;
      }
    }

    try {
      setLoading(true);
      setMessage("");

      const payload = {
        items: cartItems.map((item) => ({
          id_san_pham: item.id_san_pham,
          so_luong_dat: item.so_luong,
        })),
        hinh_thuc_thanh_toan: paymentMethod,
        dia_chi_giao_hang: address.trim(),
        phi_van_chuyen: shippingFee,
        ghi_chu: note.trim() || undefined,

        id_ao: selectedPondId || undefined,
        id_vu_nuoi: selectedCropSeasonId || undefined,
      };

      console.log("CREATE ORDER PAYLOAD:", payload);

      const orderRes = await orderService.createOrder(payload);
      const order = orderRes.data;

      if (paymentMethod === "chuyen_khoan") {
        const paymentId = order.ThanhToans?.[0]?.id_thanh_toan;

        if (!paymentId) {
          throw new Error("Không tìm thấy mã thanh toán cho đơn hàng vừa tạo.");
        }

        const payosRes = await paymentService.createPayOSPayment(paymentId);
        const checkoutUrl = payosRes.data?.checkoutUrl;

        if (!checkoutUrl) {
          throw new Error("payOS chưa trả về đường dẫn thanh toán.");
        }

        window.location.href = checkoutUrl;
        return;
      }
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("storage"));

      if (paymentMethod === "cod") {
        navigate(`/order-success?orderId=${order.id_don_hang}`);
        return;
      }

      if (paymentMethod === "tra_sau") {
        navigate(`/order-success?orderId=${order.id_don_hang}&method=tra_sau`);
        return;
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
        error.message ||
        "Không thể tạo đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <PackageCheck size={48} />
        <h2>Giỏ hàng đang trống</h2>
        <p>Vui lòng chọn vật tư trước khi tiến hành thanh toán.</p>
        <button type="button" onClick={() => navigate("/store")}>
          Quay lại cửa hàng
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <button
        className="checkout-back"
        type="button"
        onClick={() => navigate("/cart")}
      >
        <ArrowLeft size={18} />
        Quay lại giỏ hàng
      </button>

      <div className="checkout-heading">
        <div>
          <span>Đặt hàng vật tư</span>
          <h1>Thanh toán đơn hàng</h1>
          <p>
            Kiểm tra thông tin giao hàng và chọn phương thức thanh toán phù hợp.
          </p>
        </div>

        <div className="checkout-secure">
          <ShieldCheck size={20} />
          Thanh toán bảo mật
        </div>
      </div>

      <div className="checkout-layout">
        <section className="checkout-main">
          <div className="checkout-panel">
            <div className="panel-title">
              <MapPin size={21} />
              <div>
                <h2>Thông tin giao hàng</h2>
                <p>Đội giao hàng sẽ liên hệ theo thông tin tài khoản của bạn.</p>
              </div>
            </div>

            <div className="delivery-grid">
              <div>
                <label>Người nhận</label>
                <input value={user.ho_ten || "Người dùng"} readOnly />
              </div>

              <div>
                <label>Số điện thoại</label>
                <input value={user.so_dien_thoai || "Chưa cập nhật"} readOnly />
              </div>
            </div>

            <label>Địa chỉ giao hàng</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Nhập địa chỉ nhận vật tư..."
              rows={3}
            />

            <label>Ghi chú cho đơn hàng</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: giao trong giờ hành chính, gọi trước khi đến ao..."
              rows={3}
            />
          </div>

          <div className="checkout-panel">
            <div className="panel-title">
              <CreditCard size={21} />
              <div>
                <h2>Phương thức thanh toán</h2>
                <p>
                  Chỉ chuyển khoản ngân hàng mới mở QR payOS. COD và trả sau
                  không mở QR.
                </p>
              </div>
            </div>

            <div className="payment-methods">
              <button
                type="button"
                className={paymentMethod === "chuyen_khoan" ? "active" : ""}
                onClick={() => setPaymentMethod("chuyen_khoan")}
              >
                <span className="method-icon payos-mark">QR</span>
                <span>
                  <strong>Chuyển khoản ngân hàng qua payOS</strong>
                  <small>
                    Quét mã QR bằng app ngân hàng. Hệ thống tự xác nhận khi giao
                    dịch thành công.
                  </small>
                </span>
              </button>

              <button
                type="button"
                className={paymentMethod === "cod" ? "active" : ""}
                onClick={() => setPaymentMethod("cod")}
              >
                <Banknote size={24} />
                <span>
                  <strong>Thanh toán khi nhận hàng</strong>
                  <small>
                    Có thể chọn ao/vụ nuôi để quản lý lịch sử mua vật tư.
                  </small>
                </span>
              </button>

              <button
                type="button"
                className={paymentMethod === "tra_sau" ? "active" : ""}
                onClick={() => setPaymentMethod("tra_sau")}
              >
                <Truck size={24} />
                <span>
                  <strong>Mua trả sau theo vụ nuôi</strong>
                  <small>
                    Bắt buộc chọn ao nuôi và vụ nuôi đang nuôi đã được duyệt hồ
                    sơ trả sau.
                  </small>
                </span>
              </button>
            </div>
          </div>

          <div className="checkout-panel">
            <div className="panel-title">
              <PackageCheck size={21} />
              <div>
                <h2>
                  {paymentMethod === "tra_sau"
                    ? "Thông tin ao nuôi bắt buộc"
                    : "Gắn đơn hàng với ao/vụ nuôi"}
                </h2>
                <p>
                  {paymentMethod === "tra_sau"
                    ? "Đơn trả sau cần chọn ao và vụ nuôi đang nuôi để kiểm tra hồ sơ công nợ."
                    : "Bạn có thể chọn ao/vụ nuôi đang nuôi để sau này dễ quản lý vật tư đã mua."}
                </p>
              </div>
            </div>

            <div className="delivery-grid">
              <div>
                <label>Ao nuôi {paymentMethod === "tra_sau" ? "*" : ""}</label>
                <select
                  className="checkout-select"
                  value={selectedPondId}
                  onChange={(e) =>
                    setSelectedPondId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                >
                  <option value="">Không chọn ao nuôi</option>
                  {ponds.map((pond) => (
                    <option key={pond.id_ao} value={pond.id_ao}>
                      {pond.ten_ao}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Vụ nuôi {paymentMethod === "tra_sau" ? "*" : ""}</label>
                <select
                  className="checkout-select"
                  value={selectedCropSeasonId}
                  onChange={(e) =>
                    setSelectedCropSeasonId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  disabled={!selectedPondId}
                >
                  <option value="">Không chọn vụ nuôi</option>
                  {cropSeasons.map((season) => (
                    <option key={season.id_vu_nuoi} value={season.id_vu_nuoi}>
                      {season.ten_vu_nuoi}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {paymentMethod === "tra_sau" && (
              <p className="checkout-info">
                Lưu ý: trả sau không thanh toán QR. Đơn sẽ được gửi cho admin
                kiểm tra hồ sơ, công nợ và xử lý hợp đồng.
              </p>
            )}
          </div>
        </section>

        <aside className="checkout-summary">
          <h2>Tóm tắt đơn hàng</h2>

          <div className="summary-items">
            {cartItems.map((item) => (
              <div className="summary-item" key={item.id_san_pham}>
                <img src={item.hinh_anh} alt={item.ten_san_pham} />
                <div>
                  <h3>{item.ten_san_pham}</h3>
                  <p>Số lượng: {item.so_luong}</p>
                </div>
                <strong>{formatCurrency(item.gia * item.so_luong)}</strong>
              </div>
            ))}
          </div>

          <div className="summary-line">
            <span>Tổng sản phẩm</span>
            <strong>{totalItems}</strong>
          </div>

          <div className="summary-line">
            <span>Tạm tính</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>

          <div className="summary-line">
            <span>Phí vận chuyển</span>
            <strong className="free-text">Miễn phí</strong>
          </div>

          <div className="summary-total">
            <span>Tổng thanh toán</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          {message && <p className="checkout-message">{message}</p>}

          <button
            className="checkout-submit"
            type="button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Đang xử lý..."
              : paymentMethod === "chuyen_khoan"
                ? "Thanh toán qua ngân hàng"
                : paymentMethod === "tra_sau"
                  ? "Gửi đơn trả sau"
                  : "Đặt hàng"}
          </button>

          <p className="checkout-note">
            Chỉ đơn chuyển khoản mới mở QR payOS. COD và trả sau sẽ được xử lý
            theo quy trình giao hàng/hợp đồng.
          </p>
        </aside>
      </div>
    </div>
  );
}