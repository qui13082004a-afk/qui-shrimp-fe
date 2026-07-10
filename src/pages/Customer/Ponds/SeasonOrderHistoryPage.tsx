import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Eye,
  Package,
  Search,
  Truck,
  Wallet,
} from "lucide-react";
import { cropSeasonService } from "../../../services/cropSeason.service";
import type { SeasonOrderSummary, SeasonOrderItem } from "../../../services/cropSeason.service";
import "./SeasonOrderHistoryPage.css";

const formatCurrency = (value?: number | string | null) => {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "--/--/----";
  return new Date(value).toLocaleDateString("vi-VN");
};

const paymentText: Record<string, string> = {
  cod: "COD",
  chuyen_khoan: "Chuyển khoản",
  tra_sau: "Trả sau",
};

const statusText: Record<string, string> = {
  cho_xu_ly: "Chờ xác nhận",
  cho_thanh_toan: "Chờ thanh toán",
  da_thanh_toan: "Đã thanh toán",
  cho_giao: "Chờ giao",
  dang_giao: "Đang giao",
  hoan_tat: "Hoàn tất",
  giao_that_bai: "Giao thất bại",
  da_huy: "Đã hủy",
};

const getStatusClass = (status: string) => {
  if (status === "hoan_tat") return "success";
  if (["da_huy", "giao_that_bai"].includes(status)) return "danger";
  if (["dang_giao", "cho_giao"].includes(status)) return "info";
  return "warning";
};

const parseImage = (value?: string | null) => {
  if (!value) return "";
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr[0] || "" : value;
  } catch {
    return value;
  }
};

const SeasonOrderHistoryPage = () => {
  const navigate = useNavigate();
  const { id_vu_nuoi } = useParams();

  const [summary, setSummary] = useState<SeasonOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id_vu_nuoi) return;

      try {
        setLoading(true);
        const res = await cropSeasonService.getSeasonOrderSummary(Number(id_vu_nuoi));
        setSummary(res.data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id_vu_nuoi]);

  const filteredOrders = useMemo(() => {
    const orders = summary?.orders || [];
    const search = keyword.trim().toLowerCase();

    return orders.filter((order) => {
      const matchStatus = status === "all" || order.trang_thai_don_hang === status;
      const matchKeyword =
        !search ||
        String(order.id_don_hang).includes(search) ||
        order.san_pham.some((item) => item.ten_san_pham.toLowerCase().includes(search));

      return matchStatus && matchKeyword;
    });
  }, [summary, keyword, status]);

  if (loading) {
    return <div className="season-history-loading">Đang tải lịch sử mua hàng...</div>;
  }

  if (!summary) {
    return (
      <div className="season-history-empty-page">
        <h2>Không tìm thấy dữ liệu vụ nuôi</h2>
        <button onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    );
  }

  return (
    <div className="season-history-page">
      <div className="season-history-shell">
        <button className="season-history-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Quay lại ao nuôi
        </button>

        <section className="season-history-hero">
          <div className="season-hero-icon">
            <Package size={32} />
          </div>

          <div>
            <span>Lịch sử mua vật tư</span>
            <h1>{summary.ten_vu_nuoi}</h1>
            <p>
              {summary.ao_nuoi?.ten_ao} • Ngày thả giống: {formatDate(summary.ngay_tha_giong)}
            </p>
          </div>
        </section>

        <section className="season-history-stats">
          <div className="season-stat-card">
            <span>Tổng đơn</span>
            <strong>{summary.tong_so_don}</strong>
          </div>

          <div className="season-stat-card highlight">
            <span>Tổng vốn vật tư</span>
            <strong>{formatCurrency(summary.tong_von)}</strong>
          </div>

          <div className="season-stat-card">
            <span>Hoàn tất</span>
            <strong>{summary.don_hoan_tat}</strong>
          </div>

          <div className="season-stat-card">
            <span>Đang xử lý</span>
            <strong>{summary.don_dang_xu_ly}</strong>
          </div>
        </section>

        <section className="season-history-filter">
          <div className="season-search-box">
            <Search size={22} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo mã đơn hoặc tên sản phẩm..."
            />
          </div>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="cho_xu_ly">Chờ xác nhận</option>
            <option value="cho_thanh_toan">Chờ thanh toán</option>
            <option value="da_thanh_toan">Đã thanh toán</option>
            <option value="cho_giao">Chờ giao</option>
            <option value="dang_giao">Đang giao</option>
            <option value="hoan_tat">Hoàn tất</option>
          </select>
        </section>

        <section className="season-order-list">
          {filteredOrders.length === 0 ? (
            <div className="season-no-orders">Không có đơn hàng phù hợp.</div>
          ) : (
            filteredOrders.map((order: SeasonOrderItem) => {
              const isOpen = expandedOrderId === order.id_don_hang;

              return (
                <article className="season-order-card" key={order.id_don_hang}>
                  <div className="season-order-head">
                    <div>
                      <h3>Mã đơn #{order.id_don_hang}</h3>
                      <strong>{formatCurrency(order.tong_thanh_toan)}</strong>
                    </div>

                    <span className={`season-order-status ${getStatusClass(order.trang_thai_don_hang)}`}>
                      {statusText[order.trang_thai_don_hang] || order.trang_thai_don_hang}
                    </span>
                  </div>

                  <div className="season-order-info-grid">
                    <div>
                      <CreditCard size={18} />
                      <span>Thanh toán</span>
                      <strong>{paymentText[order.hinh_thuc_thanh_toan] || order.hinh_thuc_thanh_toan}</strong>
                    </div>

                    <div>
                      <Truck size={18} />
                      <span>Phí vận chuyển</span>
                      <strong>{formatCurrency(order.phi_van_chuyen)}</strong>
                    </div>

                    <div>
                      <CalendarDays size={18} />
                      <span>Ngày đặt</span>
                      <strong>{formatDate(order.ngay_dat)}</strong>
                    </div>

                    <div>
                      <Wallet size={18} />
                      <span>Tiền hàng</span>
                      <strong>{formatCurrency(order.tong_tien)}</strong>
                    </div>
                  </div>

                  <button
                    className="season-view-detail-btn"
                    onClick={() => setExpandedOrderId(isOpen ? null : order.id_don_hang)}
                  >
                    <Eye size={18} /> {isOpen ? "Ẩn chi tiết" : "Xem chi tiết"}
                  </button>

                  {isOpen && (
                    <div className="season-product-list">
                      {order.san_pham.map((item) => (
                        <div className="season-product-row" key={item.id_chi_tiet}>
                          {parseImage(item.hinh_anh) ? (
                            <img src={parseImage(item.hinh_anh)} alt={item.ten_san_pham} />
                          ) : (
                            <div className="season-product-placeholder">
                              <Package size={22} />
                            </div>
                          )}

                          <div>
                            <h4>{item.ten_san_pham}</h4>
                            <p>
                              {item.so_luong_dat} {item.don_vi_tinh || "sản phẩm"} × {formatCurrency(item.gia_ban)}
                            </p>
                          </div>

                          <strong>{formatCurrency(item.thanh_tien)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
};

export default SeasonOrderHistoryPage;
