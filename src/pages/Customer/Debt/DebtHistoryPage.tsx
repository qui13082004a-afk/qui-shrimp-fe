import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  CreditCard,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { debtService } from "../../../services/debt.service";
import type { DebtOrder } from "../../../services/debt.service";
import { toastError } from "../../../utils/notify";
import "./DebtPage.css";

const DebtHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<DebtOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const formatCurrency = (value?: number | string | null) =>
    `${Number(value || 0).toLocaleString("vi-VN")} đ`;

  const formatDate = (date?: string | null) => {
    if (!date) return "--/--/----";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const res = await debtService.getMyDebtOrders();

        if (res.success) {
          setOrders(res.data || []);
        }
      } catch (error) {
        console.error(error);
        toastError("Không thể tải lịch sử công nợ.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return orders.filter((item) => {
      if (!keyword) return true;

      return (
        String(item.noi_dung || "").toLowerCase().includes(keyword) ||
        String(item.ao_nuoi || "").toLowerCase().includes(keyword) ||
        String(item.vu_nuoi || "").toLowerCase().includes(keyword) ||
        String(item.ma_giao_dich || "").toLowerCase().includes(keyword) ||
        String(item.trang_thai || "").toLowerCase().includes(keyword)
      );
    });
  }, [orders, searchText]);

  if (loading) {
    return <div className="debt-loading">Đang tải lịch sử công nợ...</div>;
  }

  return (
    <div className="debt-page debt-dashboard">
      <div className="debt-topbar">
        <div>
          <button
            type="button"
            className="debt-primary-btn"
            onClick={() => navigate("/debt")}
          >
            <ArrowLeft size={18} strokeWidth={2.6} />
            Quay lại
          </button>

          <h1>Lịch sử công nợ</h1>
          <p>Toàn bộ lịch sử phát sinh và thanh toán công nợ.</p>
        </div>
      </div>

      <section className="debt-history-card">
        <div className="section-title-row history-head">
          <h2>
            <CalendarDays size={20} strokeWidth={2.6} />
            Toàn bộ lịch sử
          </h2>

          <div className="debt-search-inline">
            <Search size={17} strokeWidth={2.6} />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm theo nội dung, ao nuôi, vụ nuôi, mã giao dịch..."
            />
            {searchText && (
              <button type="button" onClick={() => setSearchText("")}>
                <X size={17} strokeWidth={2.6} />
              </button>
            )}
          </div>
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
              </tr>
            </thead>

            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    Chưa có lịch sử công nợ.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, index) => (
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DebtHistoryPage;
