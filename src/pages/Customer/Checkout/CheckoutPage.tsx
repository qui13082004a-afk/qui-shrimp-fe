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
  type OrderPreview,
  type PaymentMethod,
} from "../../../services/order.service";
import { paymentService } from "../../../services/payment.service";
import {
  deliveryAddressService,
  type DeliveryAddress,
} from "../../../services/deliveryAddress.service";
import {
  locationService,
  type Province,
  type Ward,
} from "../../../services/location.service";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../../lib/axios";
import "./CheckoutPage.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface CartItem {
  id_san_pham: number;
  ten_san_pham: string;
  gia: number;
  hinh_anh: string;
  so_luong: number;
  id_kho_hang?: number;
  id_kho_khach_chon?: number;
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
  id_tinh_thanh?: number | null;
  id_phuong_xa?: number | null;
  vi_do?: number | string | null;
  kinh_do?: number | string | null;
  TinhThanh?: {
    ten_tinh?: string;
  } | null;
  PhuongXa?: {
    ten_xa?: string;
  } | null;
}

interface CropSeason {
  id_vu_nuoi: number;
  id_ao: number;
  ten_vu_nuoi: string;
  trang_thai?: string;
}

interface AddressForm {
  ten_nguoi_nhan: string;
  so_dien_thoai: string;
  dia_chi_cu_the: string;
  id_tinh_thanh: string;
  id_phuong_xa: string;
  vi_do: string;
  kinh_do: string;
  la_mac_dinh: boolean;
  ghi_chu: string;
}

const defaultMapCenter: [number, number] = [9.1768, 105.1524];

function AddressMapPicker({
  lat,
  lng,
  onPick,
}: {
  lat?: number;
  lng?: number;
  onPick: (lat: number, lng: number) => void;
}) {
  const position: [number, number] =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? [lat as number, lng as number]
      : defaultMapCenter;

  function MapCenter() {
    const map = useMap();

    useEffect(() => {
      window.setTimeout(() => map.invalidateSize(), 80);
      map.setView(position, Number.isFinite(lat) && Number.isFinite(lng) ? 15 : 11);
    }, [map, position]);

    return null;
  }

  function ClickHandler() {
    useMapEvents({
      click(event) {
        onPick(event.latlng.lat, event.latlng.lng);
      },
    });
    return null;
  }

  return (
    <div className="checkout-address-map">
      <MapContainer center={position} zoom={11} scrollWheelZoom>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenter />
        <ClickHandler />
        {Number.isFinite(lat) && Number.isFinite(lng) && (
          <Marker
            position={[lat as number, lng as number]}
            draggable
            eventHandlers={{
              dragend(event) {
                const marker = event.target as L.Marker;
                const next = marker.getLatLng();
                onPick(next.lat, next.lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<StoredUser>({});
  const [deliveryAddresses, setDeliveryAddresses] = useState<DeliveryAddress[]>(
    []
  );
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "">("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    ten_nguoi_nhan: "",
    so_dien_thoai: "",
    dia_chi_cu_the: "",
    id_tinh_thanh: "",
    id_phuong_xa: "",
    vi_do: "",
    kinh_do: "",
    la_mac_dinh: false,
    ghi_chu: "",
  });
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
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<OrderPreview["van_chuyen"] | null>(
    null
  );
  const [shippingMessage, setShippingMessage] = useState("");
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
    fetchMyPonds();
    fetchMyDeliveryAddresses(storedUser);
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!showAddressModal || !addressForm.id_tinh_thanh) {
      setWards([]);
      return;
    }

    fetchWards(addressForm.id_tinh_thanh);
  }, [showAddressModal, addressForm.id_tinh_thanh]);

  useEffect(() => {
    if (!selectedPondId) {
      setCropSeasons([]);
      setSelectedCropSeasonId("");
      return;
    }

    fetchCropSeasonsByPond(selectedPondId);
  }, [selectedPondId]);

  const selectedDeliveryAddress = useMemo(
    () =>
      selectedAddressId
        ? deliveryAddresses.find(
            (item) => Number(item.id_dia_chi) === Number(selectedAddressId)
          ) || null
        : null,
    [deliveryAddresses, selectedAddressId]
  );

  useEffect(() => {
    if (!selectedDeliveryAddress) {
      setShippingInfo(null);
      setShippingMessage("Chọn địa chỉ giao hàng có tọa độ để hệ thống tự tính phí vận chuyển.");
      return;
    }

    const lat = Number(selectedDeliveryAddress.vi_do);
    const lng = Number(selectedDeliveryAddress.kinh_do);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setShippingInfo(null);
      setShippingMessage(
        "Địa chỉ giao hàng chưa có tọa độ. Vui lòng cập nhật vị trí để tính phí vận chuyển."
      );
      return;
    }

    const previewOrder = async () => {
      try {
        setShippingLoading(true);
        setShippingMessage("");
        const res = await orderService.previewOrder({
          items: cartItems.map((item) => ({
            id_san_pham: item.id_san_pham,
            so_luong_dat: item.so_luong,
            id_kho_hang: item.id_kho_hang || item.id_kho_khach_chon,
          })),
          hinh_thuc_thanh_toan: paymentMethod,
          id_dia_chi_giao_hang: selectedDeliveryAddress.id_dia_chi,
          dia_chi_giao_hang: selectedDeliveryAddress.dia_chi,
          id_ao: selectedPondId || undefined,
          id_vu_nuoi: selectedCropSeasonId || undefined,
          vi_do_giao_hang: lat,
          kinh_do_giao_hang: lng,
        });
        const preview = res.data;
        const warehouseName =
          preview.van_chuyen?.kho_xuat?.ten_kho ||
          preview.kho_xuat_du_kien?.ten_kho;

        setShippingInfo({
          ...(preview.van_chuyen || {}),
          id_khu_vuc: preview.van_chuyen?.id_khu_vuc,
          khoang_cach_km: Number(
            preview.van_chuyen?.khoang_cach_km ||
              preview.khoang_cach_kho_km ||
              0
          ),
          phi_van_chuyen: Number(preview.phi_van_chuyen || 0),
          kho_xuat: preview.van_chuyen?.kho_xuat || preview.kho_xuat_du_kien,
        });
        setShippingMessage(
          [
            warehouseName ? `Kho xuất: ${warehouseName}` : "",
            preview.van_chuyen?.thong_bao || "",
          ]
            .filter(Boolean)
            .join(". ")
        );
      } catch (error: any) {
        setShippingInfo(null);
        setShippingMessage(
          error?.response?.data?.message ||
            "Địa chỉ này chưa nằm trong khu vực phục vụ."
        );
      } finally {
        setShippingLoading(false);
      }
    };

    void previewOrder();
  }, [cartItems, paymentMethod, selectedCropSeasonId, selectedDeliveryAddress, selectedPondId]);

  const fetchMyPonds = async () => {
    try {
      const res = await api.get("/ponds/my");
      setPonds(res.data.data || []);
    } catch (error) {
      console.log("GET PONDS ERROR:", error);
    }
  };

  const fetchMyDeliveryAddresses = async (fallbackUser = user) => {
    try {
      const res = await deliveryAddressService.getMyAddresses();
      const addresses = res.data || [];
      setDeliveryAddresses(addresses);

      const defaultAddress =
        addresses.find((item: DeliveryAddress) => item.la_mac_dinh) ||
        addresses[0];

      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id_dia_chi);
      } else {
        void fallbackUser;
      }
    } catch (error) {
      console.log("GET DELIVERY ADDRESSES ERROR:", error);
    }
  };

  const fetchProvinces = async () => {
    try {
      const res = await locationService.getProvinces();
      setProvinces(res.data || []);
    } catch (error) {
      console.log("GET PROVINCES ERROR:", error);
    }
  };

  const fetchWards = async (provinceId: string) => {
    try {
      const res = await locationService.getWardsByProvince(provinceId);
      setWards(res.data || []);
    } catch (error) {
      console.log("GET WARDS ERROR:", error);
      setWards([]);
    }
  };

  const pickCurrentAddressLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Trình duyệt không hỗ trợ lấy vị trí hiện tại.");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAddressForm((prev) => ({
          ...prev,
          vi_do: position.coords.latitude.toFixed(7),
          kinh_do: position.coords.longitude.toFixed(7),
        }));
        setLoadingLocation(false);
      },
      () => {
        setMessage("Không lấy được vị trí hiện tại. Bạn có thể chọn thủ công trên bản đồ.");
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const buildFullAddress = () => {
    const province = provinces.find(
      (item) => String(item.id_tinh_thanh) === String(addressForm.id_tinh_thanh)
    );
    const ward = wards.find(
      (item) => String(item.id_phuong_xa) === String(addressForm.id_phuong_xa)
    );

    return [
      addressForm.dia_chi_cu_the.trim(),
      ward?.ten_xa,
      province?.ten_tinh,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const openAddressModal = () => {
    setAddressForm({
      ten_nguoi_nhan: user.ho_ten || "",
      so_dien_thoai: user.so_dien_thoai || "",
      dia_chi_cu_the: "",
      id_tinh_thanh: "",
      id_phuong_xa: "",
      vi_do: "",
      kinh_do: "",
      la_mac_dinh: deliveryAddresses.length === 0,
      ghi_chu: "",
    });
    setShowAddressModal(true);
    window.setTimeout(pickCurrentAddressLocation, 50);
  };

  const submitAddress = async () => {
    if (
      !addressForm.ten_nguoi_nhan.trim() ||
      !addressForm.so_dien_thoai.trim() ||
      !addressForm.id_tinh_thanh ||
      !addressForm.id_phuong_xa ||
      !addressForm.dia_chi_cu_the.trim()
    ) {
      setMessage("Vui lòng nhập đủ người nhận, số điện thoại, tỉnh/thành, xã/phường và địa chỉ cụ thể.");
      return;
    }

    if (!addressForm.vi_do || !addressForm.kinh_do) {
      setMessage("Vui lòng chọn vị trí giao hàng trên bản đồ.");
      return;
    }

    try {
      setSavingAddress(true);
      setMessage("");
      const res = await deliveryAddressService.createMyAddress({
        ten_nguoi_nhan: addressForm.ten_nguoi_nhan,
        so_dien_thoai: addressForm.so_dien_thoai,
        dia_chi: buildFullAddress(),
        vi_do: addressForm.vi_do,
        kinh_do: addressForm.kinh_do,
        la_mac_dinh: addressForm.la_mac_dinh,
        ghi_chu: addressForm.ghi_chu,
      });
      await fetchMyDeliveryAddresses(user);
      setSelectedAddressId(res.data.id_dia_chi);
      setShowAddressModal(false);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message || "Không thể lưu địa chỉ giao hàng."
      );
    } finally {
      setSavingAddress(false);
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

  const shippingFee = Number(shippingInfo?.phi_van_chuyen || 0);
  const total = subtotal + shippingFee;
  const totalItems = cartItems.reduce((acc, item) => acc + item.so_luong, 0);
  const shippingStatus = shippingLoading
    ? "loading"
    : shippingInfo
      ? "success"
      : shippingMessage
        ? "warning"
        : "idle";

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      navigate("/cart");
      return;
    }

    if (!selectedDeliveryAddress) {
      setMessage("Vui lòng chọn hoặc thêm địa chỉ giao hàng.");
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

    if (!shippingInfo) {
      setMessage(
        shippingMessage ||
          "Chưa xác định được phí vận chuyển cho địa chỉ giao hàng đã chọn."
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const payload = {
        items: cartItems.map((item) => ({
          id_san_pham: item.id_san_pham,
          so_luong_dat: item.so_luong,
          id_kho_hang: item.id_kho_hang || item.id_kho_khach_chon,
        })),
        hinh_thuc_thanh_toan: paymentMethod,
        id_dia_chi_giao_hang: selectedDeliveryAddress.id_dia_chi,
        dia_chi_giao_hang: selectedDeliveryAddress.dia_chi,
        phi_van_chuyen: shippingFee,
        ghi_chu: note.trim() || undefined,

        id_ao: selectedPondId || undefined,
        id_vu_nuoi: selectedCropSeasonId || undefined,
        id_khu_vuc_giao_hang: shippingInfo?.id_khu_vuc,
        vi_do_giao_hang: selectedDeliveryAddress.vi_do,
        kinh_do_giao_hang: selectedDeliveryAddress.kinh_do,
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
      <div className="checkout-topbar">
        <button
          className="checkout-back"
          type="button"
          onClick={() => navigate("/cart")}
        >
          <ArrowLeft size={17} />
          Quay lại
        </button>

        <div className="checkout-secure">
          <ShieldCheck size={18} />
          Thanh toán bảo mật
        </div>
      </div>

      <div className="checkout-heading">
        <div>
          <span>Đặt hàng vật tư</span>
          <h1>Thanh toán đơn hàng</h1>
          <p>Kiểm tra địa chỉ giao hàng, phương thức thanh toán và phí vận chuyển.</p>
        </div>
      </div>

      <div className="checkout-layout">
        <section className="checkout-main">
          <div className="checkout-card">
            <div className="checkout-card-title">
              <MapPin size={21} />
              <div>
                <h2>Thông tin giao hàng</h2>
                <p>Đội giao hàng sẽ liên hệ theo thông tin địa chỉ đã chọn.</p>
              </div>
            </div>

            <div className="checkout-address-actions">
              <div>
                <label>Địa chỉ giao hàng</label>
                <select
                  className="checkout-select"
                  value={selectedAddressId}
                  onChange={(event) =>
                    setSelectedAddressId(
                      event.target.value ? Number(event.target.value) : ""
                    )
                  }
                >
                  <option value="">Chọn địa chỉ giao hàng</option>
                  {deliveryAddresses.map((item) => (
                    <option key={item.id_dia_chi} value={item.id_dia_chi}>
                      {item.la_mac_dinh ? "[Mặc định] " : ""}
                      {item.dia_chi}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={openAddressModal}>
                + Thêm địa chỉ
              </button>
            </div>

            {selectedDeliveryAddress ? (
              <div className="checkout-address-preview">
                <strong>
                  {selectedDeliveryAddress.ten_nguoi_nhan} -{" "}
                  {selectedDeliveryAddress.so_dien_thoai}
                </strong>
                <span>{selectedDeliveryAddress.dia_chi}</span>
                <small>
                  {selectedDeliveryAddress.PhuongXa?.ten_xa || "Chưa rõ xã"} -{" "}
                  {selectedDeliveryAddress.TinhThanh?.ten_tinh || "Chưa rõ tỉnh"}
                </small>
              </div>
            ) : (
              <div className="checkout-address-empty">
                Chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ và chọn vị trí
                trên bản đồ để tính phí vận chuyển.
              </div>
            )}

            <label>Ghi chú cho đơn hàng</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: giao trong giờ hành chính, gọi trước khi đến ao..."
              rows={3}
            />
          </div>

          <div className="checkout-card">
            <div className="checkout-card-title">
              <CreditCard size={21} />
              <div>
                <h2>Phương thức thanh toán</h2>
                <p>Chọn cách thanh toán phù hợp cho đơn hàng này.</p>
              </div>
            </div>

            <div className="payment-methods">
              <button
                type="button"
                className={paymentMethod === "chuyen_khoan" ? "active" : ""}
                onClick={() => setPaymentMethod("chuyen_khoan")}
              >
                <span className="checkout-radio-dot" />
                <span className="method-icon payos-mark">QR</span>
                <span>
                  <strong>Chuyển khoản ngân hàng qua payOS</strong>
                  <small>Quét QR, hệ thống tự xác nhận khi giao dịch thành công.</small>
                </span>
              </button>

              <button
                type="button"
                className={paymentMethod === "cod" ? "active" : ""}
                onClick={() => setPaymentMethod("cod")}
              >
                <span className="checkout-radio-dot" />
                <Banknote size={24} />
                <span>
                  <strong>Thanh toán khi nhận hàng</strong>
                  <small>Nhân viên giao hàng thu tiền khi bàn giao vật tư.</small>
                </span>
              </button>

              <button
                type="button"
                className={paymentMethod === "tra_sau" ? "active" : ""}
                onClick={() => setPaymentMethod("tra_sau")}
              >
                <span className="checkout-radio-dot" />
                <Truck size={24} />
                <span>
                  <strong>Mua trả sau theo vụ nuôi</strong>
                  <small>Bắt buộc chọn ao và vụ nuôi có hồ sơ trả sau hợp lệ.</small>
                </span>
              </button>
            </div>
          </div>

          <div className="checkout-card">
            <div className="checkout-card-title">
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

            <div className={`checkout-shipping-box ${shippingStatus}`}>
              <div className="checkout-shipping-box__main">
                <strong>Phí vận chuyển theo địa chỉ giao hàng</strong>
                <span>
                  {shippingLoading
                    ? "Đang tính phí vận chuyển..."
                    : shippingInfo
                      ? `${Number(shippingInfo.khoang_cach_km || 0).toFixed(
                          2
                        )} km - ${formatCurrency(
                          Number(shippingInfo.phi_van_chuyen || 0)
                        )}`
                      : shippingMessage || "Chưa có thông tin tính phí."}
                </span>
              </div>

              {shippingInfo?.dia_gioi && (
                <small>
                  Khu vực phục vụ: {shippingInfo.dia_gioi.ten_xa} -{" "}
                  {shippingInfo.dia_gioi.ten_tinh}
                </small>
              )}

              {shippingMessage && <p>{shippingMessage}</p>}
            </div>
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
            <strong className={shippingFee === 0 ? "free-text" : ""}>
              {shippingLoading ? "Đang tính..." : formatCurrency(shippingFee)}
            </strong>
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

      {showAddressModal && (
        <div className="checkout-modal-overlay">
          <div className="checkout-address-modal">
            <div className="checkout-address-modal__header">
              <div>
                <h2>Thêm địa chỉ giao hàng</h2>
                <p>Chọn đúng vị trí trên bản đồ để hệ thống tính phí vận chuyển.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
              >
                ×
              </button>
            </div>

            <div className="checkout-address-form">
              <label>
                Người nhận
                <input
                  value={addressForm.ten_nguoi_nhan}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      ten_nguoi_nhan: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Số điện thoại
                <input
                  value={addressForm.so_dien_thoai}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      so_dien_thoai: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Tỉnh/thành
                <select
                  value={addressForm.id_tinh_thanh}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      id_tinh_thanh: event.target.value,
                      id_phuong_xa: "",
                    }))
                  }
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {provinces.map((province) => (
                    <option
                      key={province.id_tinh_thanh}
                      value={province.id_tinh_thanh}
                    >
                      {province.ten_tinh}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Xã/phường
                <select
                  value={addressForm.id_phuong_xa}
                  disabled={!addressForm.id_tinh_thanh}
                  onChange={(event) => {
                    const selectedWard = wards.find(
                      (ward) =>
                        String(ward.id_phuong_xa) === String(event.target.value)
                    );
                    const wardLat = Number(selectedWard?.vi_do_trung_tam);
                    const wardLng = Number(selectedWard?.kinh_do_trung_tam);
                    const hasWardCoordinate =
                      Number.isFinite(wardLat) && Number.isFinite(wardLng);
                    setAddressForm((prev) => ({
                      ...prev,
                      id_phuong_xa: event.target.value,
                      vi_do: hasWardCoordinate ? wardLat.toFixed(7) : prev.vi_do,
                      kinh_do: hasWardCoordinate ? wardLng.toFixed(7) : prev.kinh_do,
                    }));
                  }}
                >
                  <option value="">Chọn xã/phường</option>
                  {wards.map((ward) => (
                    <option key={ward.id_phuong_xa} value={ward.id_phuong_xa}>
                      {ward.ten_xa}
                    </option>
                  ))}
                </select>
              </label>

              <label className="full">
                Số nhà, đường, ấp/khu vực cụ thể
                <textarea
                  value={addressForm.dia_chi_cu_the}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      dia_chi_cu_the: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Ví dụ: ấp 7, đường vào ao số 2..."
                />
              </label>

              <label>
                Vĩ độ
                <input value={addressForm.vi_do} readOnly />
              </label>

              <label>
                Kinh độ
                <input value={addressForm.kinh_do} readOnly />
              </label>

              <div className="full">
                <div className="checkout-map-toolbar">
                  <div>
                    <strong>Vị trí giao hàng</strong>
                    <span>Map tự lấy vị trí hiện tại. Bạn có thể click hoặc kéo marker để chỉnh lại.</span>
                  </div>
                  <button
                    type="button"
                    onClick={pickCurrentAddressLocation}
                    disabled={loadingLocation}
                  >
                    {loadingLocation ? "Đang lấy..." : "Lấy vị trí của tôi"}
                  </button>
                </div>
                <AddressMapPicker
                  lat={Number(addressForm.vi_do)}
                  lng={Number(addressForm.kinh_do)}
                  onPick={(lat, lng) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      vi_do: lat.toFixed(7),
                      kinh_do: lng.toFixed(7),
                    }))
                  }
                />
              </div>

              <label className="checkout-checkbox full">
                <input
                  type="checkbox"
                  checked={addressForm.la_mac_dinh}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      la_mac_dinh: event.target.checked,
                    }))
                  }
                />
                <span>Đặt làm địa chỉ mặc định</span>
              </label>

              <label className="full">
                Ghi chú
                <textarea
                  value={addressForm.ghi_chu}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      ghi_chu: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Ví dụ: gọi trước khi giao, đường vào ao..."
                />
              </label>
            </div>

            <div className="checkout-address-modal__actions">
              <button
                className="checkout-address-cancel"
                type="button"
                onClick={() => setShowAddressModal(false)}
              >
                Hủy
              </button>
              <button type="button" onClick={submitAddress} disabled={savingAddress}>
                {savingAddress ? "Đang lưu..." : "Lưu địa chỉ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

