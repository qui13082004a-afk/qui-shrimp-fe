import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  CreditCard,
  Eye,
  Filter,
  Search,
  ShoppingCart,
  Waves,
  X,
} from "lucide-react";
import { debtService } from "../../../services/debt.service";
import type {
  DebtLimitByPond,
  DebtOrder,
  DebtSummary,
} from "../../../services/debt.service";
import "./DebtPage.css";

type PondFilter = "all" | "ok" | "warn" | "danger";

const DebtPage: React.FC = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [orders, setOrders] = useState<DebtOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<number | "">("");

  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pondFilter, setPondFilter] = useState<PondFilter>("all");

  const formatCurrency = (value?: number | string | null) =>
    `${Number(value || 0).toLocaleString("vi-VN")} đ`;

  const formatDate = (date?: string | null) => {
    if (!date) return "--/--/----";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const loadDebtData = async () => {
    try {
      setLoading(true);

      const [summaryRes, ordersRes] = await Promise.all([
        debtService.getMySummary(),
        debtService.getMyDebtOrders(),
      ]);

      if (summaryRes.success) setSummary(summaryRes.data);
      if (ordersRes.success) setOrders(ordersRes.data || []);
    } catch (error) {
      console.error(error);
      alert("Không thể tải dữ liệu công nợ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebtData();
  }, []);

  const ponds: DebtLimitByPond[] = useMemo(() => {
    return summary?.han_muc_theo_ho_so || summary?.tong_quan_theo_ao || [];
  }, [summary]);

  const paidAmount = Number(summary?.da_thanh_toan || 0);
  const totalLimit = Number(summary?.tong_han_muc || 0);

  const currentDebt = Number(
    summary?.cong_no_hien_tai || summary?.tong_cong_no || 0
  );

  const reservedDebt = Number(summary?.dang_giu_han_muc || 0);
  const totalPayableDebt = currentDebt + reservedDebt;

  const usedCredit = totalPayableDebt;
  const availableCredit = Math.max(totalLimit - usedCredit, 0);

  const usedPercent =
    totalLimit > 0 ? Math.min((usedCredit / totalLimit) * 100, 100) : 0;

  const nextDueDate = summary?.han_gan_nhat || null;

  const getPondNumbers = (item: DebtLimitByPond) => {
    const limit = Number(item.dinh_muc_cong_no || 0);
    const debt = Number(item.cong_no_hien_tai ?? item.tong_cong_no ?? 0);
    const reserved = Number(item.dang_giu_han_muc ?? 0);
    const used = debt + reserved;
    const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

    return {
      limit,
      debt,
      reserved,
      used,
      available: Math.max(limit - used, 0),
      percent,
    };
  };

  const getCardStatus = (item: DebtLimitByPond) => {
    const percent = Number(item.phan_tram_su_dung || 0);

    if (percent >= 90) {
      return {
        type: "danger" as const,
        label: "QUÁ HẠN",
        className: "debt-badge-danger",
      };
    }

    if (percent >= 70) {
      return {
        type: "warn" as const,
        label: "CẦN THEO DÕI",
        className: "debt-badge-warn",
      };
    }

    return {
      type: "ok" as const,
      label: "ỔN ĐỊNH",
      className: "debt-badge-ok",
    };
  };

  const filteredPonds = useMemo(() => {
    return ponds.filter((item) => {
      const status = getCardStatus(item);
      const keyword = searchText.trim().toLowerCase();

      const matchSearch =
        !keyword ||
        String(item.ten_ao || "").toLowerCase().includes(keyword) ||
        String(item.id_ao || "").includes(keyword) ||
        String(item.id_vu_nuoi || "").includes(keyword);

      const matchFilter = pondFilter === "all" || status.type === pondFilter;

      return matchSearch && matchFilter;
    });
  }, [ponds, searchText, pondFilter]);

  const recentTransactions = useMemo(() => {
    return orders
      .filter((item) => {
        const keyword = searchText.trim().toLowerCase();

        if (!keyword) return true;

        return (
          String(item.noi_dung || "").toLowerCase().includes(keyword) ||
          String(item.ao_nuoi || "").toLowerCase().includes(keyword) ||
          String(item.vu_nuoi || "").toLowerCase().includes(keyword) ||
          String(item.ma_giao_dich || "").toLowerCase().includes(keyword)
        );
      })
      .slice(0, 6);
  }, [orders, searchText]);

  const selectedProfileDebt = useMemo(() => {
    if (!selectedProfileId) return totalPayableDebt;

    const selected = ponds.find(
      (item) => Number(item.id_ho_so) === Number(selectedProfileId)
    );

    if (!selected) return 0;

    const numbers = getPondNumbers(selected);
    return numbers.debt + numbers.reserved;
  }, [selectedProfileId, ponds, totalPayableDebt]);

  const openPayModal = () => {
    if (totalPayableDebt <= 0) {
      alert("Không có công nợ cần thanh toán.");
      return;
    }

    setSelectedProfileId("");
    setPayAmount(String(totalPayableDebt));
    setShowPayModal(true);
  };

  const handleQuickPay = async () => {
    const amount = Number(payAmount);

    if (!amount || amount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    if (amount > selectedProfileDebt) {
      alert("Số tiền thanh toán không được vượt quá công nợ đã chọn.");
      return;
    }

    try {
      setPaying(true);

      const res = await debtService.payPartialDebt(
        amount,
        selectedProfileId || null
      );

      if (!res.data?.checkoutUrl) {
        alert("Không nhận được link thanh toán.");
        return;
      }

      window.location.href = res.data.checkoutUrl;
    } catch (error: any) {
      alert(error.response?.data?.message || "Không thể tạo thanh toán công nợ.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="debt-loading">Đang tải dữ liệu công nợ...</div>;
  }

  return (
    <div className="debt-page debt-dashboard">
      <div className="debt-topbar">
        <div>
          <h1>Tổng quan Công nợ theo Vụ nuôi</h1>
          <p>Quản lý hạn mức tín dụng và dư nợ các ao nuôi trong hệ thống.</p>
        </div>

        <button
          className="debt-primary-btn"
          type="button"
          onClick={openPayModal}
          disabled={paying}
        >
          <CreditCard size={18} strokeWidth={2.6} />
          Thanh toán công nợ
        </button>
      </div>

      <div className="debt-overview-grid">
        <section className="debt-overview-main">
          <div>
            <span className="overview-label">Tổng dư nợ hiện tại</span>
            <strong>{formatCurrency(totalPayableDebt)}</strong>
          </div>

          <div className="overview-percent">
            <strong>{Math.round(usedPercent)}%</strong>
            <span>Đã dùng</span>
          </div>

          <div className="overview-bottom">
            <span className="alert-pill">
              <AlertTriangle size={15} strokeWidth={2.8} />
              Cần thanh toán
            </span>
            <span>Hạn mức còn lại: {formatCurrency(availableCredit)}</span>
            <span>Hạn mức: {formatCurrency(totalLimit)}</span>
          </div>
        </section>

        <aside className="debt-side-cards">
          <div className="debt-side-card paid">
            <span className="side-icon">
              <Check size={24} strokeWidth={3} />
            </span>
            <div>
              <small>Đã thanh toán</small>
              <strong>{formatCurrency(paidAmount)}</strong>
            </div>
          </div>

          <div className="debt-side-card due">
            <span className="side-icon">
              <CalendarDays size={24} strokeWidth={2.6} />
            </span>
            <div>
              <small>Ngày đến hạn tiếp theo</small>
              <strong>{formatDate(nextDueDate)}</strong>
            </div>
          </div>
        </aside>
      </div>

      <div className="section-title-row">
        <h2>
          <Waves size={20} strokeWidth={2.6} />
          Chi tiết công nợ theo Ao nuôi
        </h2>

        <div className="section-actions">
          <button
            className={`icon-btn ${showFilter ? "active" : ""}`}
            type="button"
            onClick={() => setShowFilter((prev) => !prev)}
          >
            <Filter size={17} strokeWidth={2.6} />
          </button>

          <button
            className={`icon-btn ${showSearch ? "active" : ""}`}
            type="button"
            onClick={() => setShowSearch((prev) => !prev)}
          >
            <Search size={17} strokeWidth={2.6} />
          </button>
        </div>
      </div>

      {(showSearch || showFilter) && (
        <div className="debt-tools-panel">
          {showSearch && (
            <div className="debt-search-inline">
              <Search size={17} strokeWidth={2.6} />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Tìm theo tên ao, mã ao, mã vụ nuôi, mã đơn..."
              />
              {searchText && (
                <button type="button" onClick={() => setSearchText("")}>
                  <X size={17} strokeWidth={2.6} />
                </button>
              )}
            </div>
          )}

          {showFilter && (
            <div className="debt-filter-inline">
              <button
                className={pondFilter === "all" ? "active" : ""}
                onClick={() => setPondFilter("all")}
              >
                Tất cả
              </button>
              <button
                className={pondFilter === "ok" ? "active ok" : "ok"}
                onClick={() => setPondFilter("ok")}
              >
                Ổn định
              </button>
              <button
                className={pondFilter === "warn" ? "active warn" : "warn"}
                onClick={() => setPondFilter("warn")}
              >
                Cần theo dõi
              </button>
              <button
                className={pondFilter === "danger" ? "active danger" : "danger"}
                onClick={() => setPondFilter("danger")}
              >
                Quá hạn
              </button>
            </div>
          )}
        </div>
      )}

      <div className="pond-card-grid">
        {filteredPonds.length === 0 ? (
          <div className="debt-empty-small">Không tìm thấy hồ sơ phù hợp.</div>
        ) : (
          filteredPonds.map((item, index) => {
            const numbers = getPondNumbers(item);
            const status = getCardStatus(item);

            return (
              <div className="pond-debt-card" key={item.id_ho_so}>
                <div className={`pond-image pond-image-${(index % 3) + 1}`}>
                  <span className={`pond-status ${status.className}`}>
                    {status.label}
                  </span>
                  <div>
                    <h3>{item.ten_ao || `Ao ${item.id_ao}`}</h3>
                    <p>Vụ nuôi #{item.id_vu_nuoi || "--"}</p>
                  </div>
                </div>

                <div className="pond-card-body">
                  <div className="pond-money-row">
                    <div>
                      <small>Dư nợ riêng</small>
                      <strong>
                        {formatCurrency(numbers.debt + numbers.reserved)}
                      </strong>
                    </div>
                    <div>
                      <small>Kỳ hạn</small>
                      <strong>{formatDate(item.han_thanh_toan)}</strong>
                    </div>
                  </div>

                  <div className="pond-progress">
                    <div style={{ width: `${numbers.percent}%` }} />
                  </div>

                  <button
                    className={
                      status.type === "danger"
                        ? "pond-pay-now"
                        : "pond-detail-btn"
                    }
                    type="button"
                    onClick={() => navigate(`/debt/profile/${item.id_ho_so}`)}
                  >
                    {status.type === "danger" ? (
                      <>
                        <CreditCard size={17} strokeWidth={2.7} />
                        Thanh toán ngay
                      </>
                    ) : (
                      <>
                        <Eye size={17} strokeWidth={2.7} />
                        Chi tiết vụ nuôi
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <section className="debt-history-card">
        <div className="section-title-row history-head">
          <h2>
            <CalendarDays size={20} strokeWidth={2.6} />
            Lịch sử thanh toán & Phát sinh
          </h2>
        </div>

        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Ngày giao dịch</th>
                <th>Nội dung</th>
                <th>Số tiền (đ)</th>
                <th>Ao nuôi</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    Chưa có lịch sử phát sinh.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((item, index) => (
                  <tr key={`${item.loai}-${item.ngay_giao_dich}-${index}`}>
                    <td>{formatDate(item.ngay_giao_dich)}</td>

                    <td>
                      <div className="history-content">
                        {item.loai === "thanh_toan" ? (
                          <CreditCard size={18} strokeWidth={2.5} />
                        ) : (
                          <ShoppingCart size={18} strokeWidth={2.5} />
                        )}

                        <div>
                          <strong>{item.noi_dung}</strong>
                          <span>
                            {item.vu_nuoi || item.ma_giao_dich || "Công nợ"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td
                      className={
                        item.loai === "thanh_toan"
                          ? "money-plus"
                          : "money-minus"
                      }
                    >
                      {item.loai === "thanh_toan" ? "+ " : "- "}
                      {formatCurrency(item.so_tien)}
                    </td>

                    <td>
                      <span className="pond-tag">
                        {item.ao_nuoi || "Không áp dụng"}
                      </span>
                    </td>

                    <td>
                      <span className="history-status">
                        <CircleCheck size={16} strokeWidth={2.6} />
                        {item.trang_thai === "thanh_cong" ||
                          item.trang_thai === "hoan_tat"
                          ? "Hoàn tất"
                          : "Đang xử lý"}
                      </span>
                    </td>

                    <td>
                      <ChevronRight size={18} strokeWidth={2.6} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <button
            type="button"
            className="view-more-history"
            onClick={() => navigate("/debt/history")}
          >
            Xem thêm toàn bộ lịch sử
          </button>
        </div>
      </section>

      {showPayModal && (
        <div className="debt-modal-overlay">
          <div className="debt-pay-modal">
            <h3>Thanh toán công nợ</h3>

            <p>
              Công nợ có thể thanh toán:
              <strong> {formatCurrency(selectedProfileDebt)}</strong>
            </p>
            <label>Thanh toán cho</label>
            <select
              value={selectedProfileId}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : "";

                setSelectedProfileId(value);

                if (!value) {
                  setPayAmount(String(totalPayableDebt));
                  return;
                }

                const selected = ponds.find(
                  (item) => Number(item.id_ho_so) === Number(value)
                );

                if (selected) {
                  const numbers = getPondNumbers(selected);
                  setPayAmount(String(numbers.debt + numbers.reserved));
                }
              }}
            >
              <option value="">🌍 Tất cả công nợ</option>

              {ponds
                .filter((item) => {
                  const numbers = getPondNumbers(item);
                  return numbers.debt + numbers.reserved > 0;
                })
                .map((item) => {
                  const numbers = getPondNumbers(item);

                  return (
                    <option key={item.id_ho_so} value={item.id_ho_so}>
                      {item.ten_ao || `Ao #${item.id_ao}`} - Vụ #
                      {item.id_vu_nuoi || "--"} -{" "}
                      {formatCurrency(numbers.debt + numbers.reserved)}
                    </option>
                  );
                })}
            </select>
            <label>Số tiền thanh toán</label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="Nhập số tiền muốn thanh toán"
            />

            <div className="debt-modal-actions">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                disabled={paying}
              >
                Hủy
              </button>

              <button type="button" onClick={handleQuickPay} disabled={paying}>
                {paying ? "Đang tạo..." : "Thanh toán"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtPage;