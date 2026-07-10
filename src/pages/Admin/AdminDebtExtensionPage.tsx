import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  debtExtensionService,
  type DebtExtension,
} from "../../services/debtExtension.service";
import "./AdminCommon.css";
import "./AdminDebtExtensionPage.css";

const statusLabel: Record<string, string> = {
  cho_duyet: "Chờ duyệt",
  da_duyet: "Đã duyệt",
  tu_choi: "Từ chối",
};

const formatDate = (value?: string | null) => {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleDateString("vi-VN");
};

const formatCurrency = (value?: number | string | null) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const parseImages = (value?: string[] | string | null) => {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
};

export default function AdminDebtExtensionPage() {
  const [extensions, setExtensions] = useState<DebtExtension[]>([]);
  const [selectedExtension, setSelectedExtension] =
    useState<DebtExtension | null>(null);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [message, setMessage] = useState("");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  const fetchExtensions = async () => {
    try {
      setLoading(true);
      const res = await debtExtensionService.getAllDebtExtensions();
      setExtensions(Array.isArray(res) ? res : res?.data || []);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          "Không tải được danh sách yêu cầu gia hạn"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, []);

  const stats = useMemo(() => {
    return {
      total: extensions.length,
      pending: extensions.filter((item) => item.trang_thai === "cho_duyet")
        .length,
      approved: extensions.filter((item) => item.trang_thai === "da_duyet")
        .length,
      rejected: extensions.filter((item) => item.trang_thai === "tu_choi")
        .length,
    };
  }, [extensions]);

  const filteredExtensions = useMemo(() => {
    return extensions.filter((item) => {
      const searchText = `${item.id_gia_han || ""} ${item.id_ho_so || ""} ${
        item.nguoi_gui?.ho_ten || ""
      } ${item.nguoi_gui?.so_dien_thoai || ""} ${
        item.HoSoKhachHang?.NguoiDung?.ho_ten || ""
      } ${item.HoSoKhachHang?.AoNuoi?.ten_ao || ""} ${
        item.HoSoKhachHang?.VuNuoi?.ten_vu_nuoi || ""
      } ${item.ly_do || ""}`.toLowerCase();

      const matchKeyword = searchText.includes(keyword.toLowerCase().trim());
      const matchStatus =
        statusFilter === "all" || item.trang_thai === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [extensions, keyword, statusFilter]);

  const getCustomerName = (item: DebtExtension) => {
    return (
      item.nguoi_gui?.ho_ten ||
      item.HoSoKhachHang?.NguoiDung?.ho_ten ||
      "Chưa có thông tin"
    );
  };

  const getPhone = (item: DebtExtension) => {
    return (
      item.nguoi_gui?.so_dien_thoai ||
      item.HoSoKhachHang?.NguoiDung?.so_dien_thoai ||
      "Chưa có SĐT"
    );
  };

  const openDetail = (extension: DebtExtension) => {
    setSelectedExtension(extension);
    setApproveNote(extension.ghi_chu || "");
    setRejectReason("");
    setRejectNote("");
    setShowRejectModal(false);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setSelectedExtension(null);
    setApproveNote("");
    setRejectReason("");
    setRejectNote("");
    setShowRejectModal(false);
    setShowDetailModal(false);
  };

  const handleApprove = async () => {
    if (!selectedExtension?.id_gia_han) {
      setMessage("Không tìm thấy mã yêu cầu gia hạn");
      return;
    }

    try {
      setProcessing(true);

      await debtExtensionService.approveDebtExtension(
        selectedExtension.id_gia_han,
        {
          ghi_chu: approveNote.trim() || null,
        }
      );

      setMessage("Duyệt yêu cầu gia hạn thành công");
      closeDetail();
      fetchExtensions();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Duyệt yêu cầu thất bại");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedExtension?.id_gia_han) {
      setMessage("Không tìm thấy mã yêu cầu gia hạn");
      return;
    }

    if (!rejectReason.trim()) {
      setMessage("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setProcessing(true);

      await debtExtensionService.rejectDebtExtension(
        selectedExtension.id_gia_han,
        {
          ly_do_tu_choi: rejectReason.trim(),
          ghi_chu: rejectNote.trim() || null,
        }
      );

      setMessage("Từ chối yêu cầu gia hạn thành công");
      closeDetail();
      fetchExtensions();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Từ chối yêu cầu thất bại");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="admin-page debt-extension-page">
      <div className="admin-page__header admin-page__header--between">
        <div>
          <p className="admin-page__eyebrow">Công nợ</p>
          <h1>Quản lý gia hạn thanh toán</h1>
          <p>
            Xem xét yêu cầu gia hạn thanh toán của khách hàng theo từng hồ sơ
            mua trả sau.
          </p>
        </div>
      </div>

      {message && (
        <div className="admin-alert debt-extension-alert">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      <div className="debt-extension-stats">
        <div className="debt-extension-stat-card">
          <span>Tổng yêu cầu</span>
          <strong>{stats.total}</strong>
          <p>Toàn bộ đơn gia hạn</p>
        </div>

        <div className="debt-extension-stat-card">
          <span>Chờ duyệt</span>
          <strong>{stats.pending}</strong>
          <p>Cần Admin xử lý</p>
        </div>

        <div className="debt-extension-stat-card">
          <span>Đã duyệt</span>
          <strong>{stats.approved}</strong>
          <p>Đã cập nhật hạn thanh toán</p>
        </div>

        <div className="debt-extension-stat-card">
          <span>Từ chối</span>
          <strong>{stats.rejected}</strong>
          <p>Không đủ điều kiện gia hạn</p>
        </div>
      </div>

      <div className="admin-card debt-extension-card">
        <div className="debt-extension-card__top">
          <div>
            <h2>Danh sách yêu cầu gia hạn</h2>
            <p>
              Kiểm tra hạn cũ, hạn đề xuất, số ngày gia hạn và lý do khách hàng
              gửi.
            </p>
          </div>
        </div>

        <div className="admin-toolbar debt-extension-toolbar">
          <input
            value={keyword}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setKeyword(event.target.value)
            }
            placeholder="Tìm mã yêu cầu, khách hàng, SĐT, hồ sơ, ao, vụ nuôi..."
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="cho_duyet">Chờ duyệt</option>
            <option value="da_duyet">Đã duyệt</option>
            <option value="tu_choi">Từ chối</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table debt-extension-table">
            <thead>
              <tr>
                <th>Yêu cầu</th>
                <th>Khách hàng</th>
                <th>Hồ sơ / Vụ nuôi</th>
                <th>Hạn cũ</th>
                <th>Hạn đề xuất</th>
                <th>Số ngày</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>
                    <div className="debt-extension-empty">
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredExtensions.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="debt-extension-empty">
                      <strong>Chưa có yêu cầu phù hợp</strong>
                      <span>Hãy thay đổi từ khóa tìm kiếm hoặc bộ lọc.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExtensions.map((item) => (
                  <tr key={item.id_gia_han}>
                    <td>
                      <strong>#{item.id_gia_han}</strong>
                      <span>Hồ sơ #{item.id_ho_so}</span>
                    </td>

                    <td>
                      <strong>{getCustomerName(item)}</strong>
                      <span>{getPhone(item)}</span>
                    </td>

                    <td>
                      <strong>
                        {item.HoSoKhachHang?.AoNuoi?.ten_ao || "Chưa có ao"}
                      </strong>
                      <span>
                        {item.HoSoKhachHang?.VuNuoi?.ten_vu_nuoi ||
                          "Chưa có vụ nuôi"}
                      </span>
                    </td>

                    <td>{formatDate(item.han_cu)}</td>

                    <td>
                      <strong>{formatDate(item.han_de_xuat)}</strong>
                    </td>

                    <td>{item.so_ngay_gia_han || 0} ngày</td>

                    <td>{formatDate(item.ngay_gui)}</td>

                    <td>
                      <span className={`admin-badge ${item.trang_thai}`}>
                        {statusLabel[item.trang_thai || ""] || "Chưa rõ"}
                      </span>
                    </td>

                    <td>
                      <div className="debt-extension-actions">
                        <button onClick={() => openDetail(item)}>
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailModal && selectedExtension && (
        <div className="admin-modal-overlay">
          <div className="admin-modal debt-extension-modal">
            <div className="admin-modal__header">
              <div>
                <h2>Chi tiết yêu cầu gia hạn</h2>
                <p>
                  Kiểm tra hồ sơ, hạn thanh toán và lý do trước khi duyệt hoặc
                  từ chối.
                </p>
              </div>

              <button className="admin-modal__close" onClick={closeDetail}>
                ×
              </button>
            </div>

            <div className="debt-extension-detail">
              <div className="debt-extension-detail__main">
                <div className="debt-extension-section">
                  <h3>Thông tin yêu cầu</h3>

                  <div className="debt-extension-info-grid">
                    <div>
                      <span>Mã yêu cầu</span>
                      <strong>#{selectedExtension.id_gia_han}</strong>
                    </div>

                    <div>
                      <span>Mã hồ sơ</span>
                      <strong>#{selectedExtension.id_ho_so}</strong>
                    </div>

                    <div>
                      <span>Ngày gửi</span>
                      <strong>{formatDate(selectedExtension.ngay_gui)}</strong>
                    </div>

                    <div>
                      <span>Ngày duyệt</span>
                      <strong>{formatDate(selectedExtension.ngay_duyet)}</strong>
                    </div>
                  </div>
                </div>

                <div className="debt-extension-section">
                  <h3>Khách hàng / Vụ nuôi</h3>

                  <div className="debt-extension-info-grid">
                    <div>
                      <span>Khách hàng</span>
                      <strong>{getCustomerName(selectedExtension)}</strong>
                    </div>

                    <div>
                      <span>Số điện thoại</span>
                      <strong>{getPhone(selectedExtension)}</strong>
                    </div>

                    <div>
                      <span>Ao nuôi</span>
                      <strong>
                        {selectedExtension.HoSoKhachHang?.AoNuoi?.ten_ao ||
                          "Chưa có"}
                      </strong>
                    </div>

                    <div>
                      <span>Vụ nuôi</span>
                      <strong>
                        {selectedExtension.HoSoKhachHang?.VuNuoi?.ten_vu_nuoi ||
                          "Chưa có"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="debt-extension-section">
                  <h3>Thông tin công nợ</h3>

                  <div className="debt-extension-money-box">
                    <span>Định mức công nợ hồ sơ</span>
                    <strong>
                      {formatCurrency(
                        selectedExtension.HoSoKhachHang?.dinh_muc_cong_no
                      )}
                    </strong>
                  </div>

                  <div className="debt-extension-timeline">
                    <div>
                      <span>Hạn cũ</span>
                      <strong>{formatDate(selectedExtension.han_cu)}</strong>
                    </div>

                    <div>
                      <span>Hạn đề xuất</span>
                      <strong>
                        {formatDate(selectedExtension.han_de_xuat)}
                      </strong>
                    </div>

                    <div>
                      <span>Số ngày gia hạn</span>
                      <strong>
                        {selectedExtension.so_ngay_gia_han || 0} ngày
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="debt-extension-section">
                  <h3>Lý do / Ghi chú</h3>

                  <div className="debt-extension-note">
                    <span>Lý do khách hàng gửi</span>
                    <p>{selectedExtension.ly_do || "Chưa có lý do"}</p>
                  </div>

                  {selectedExtension.ghi_chu && (
                    <div className="debt-extension-note">
                      <span>Ghi chú</span>
                      <p>{selectedExtension.ghi_chu}</p>
                    </div>
                  )}

                  {selectedExtension.ly_do_tu_choi && (
                    <div className="debt-extension-note danger">
                      <span>Lý do từ chối</span>
                      <p>{selectedExtension.ly_do_tu_choi}</p>
                    </div>
                  )}
                </div>

                {parseImages(selectedExtension.hinh_anh_minh_chung).length >
                  0 && (
                  <div className="debt-extension-section">
                    <h3>Minh chứng</h3>

                    <div className="debt-extension-docs">
                      {parseImages(selectedExtension.hinh_anh_minh_chung).map(
                        (image, index) => (
                          <a
                            key={`${image}-${index}`}
                            href={image}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Minh chứng {index + 1}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedExtension.trang_thai === "cho_duyet" && (
                <div className="debt-extension-approval-box">
                  <h3>Xử lý yêu cầu</h3>

                  <label>
                    Ghi chú khi duyệt
                    <textarea
                      value={approveNote}
                      onChange={(event) => setApproveNote(event.target.value)}
                      placeholder="Nhập ghi chú nội bộ nếu cần..."
                    />
                  </label>

                  <div className="debt-extension-approval-actions">
                    <button
                      className="admin-secondary-btn"
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing}
                    >
                      Từ chối
                    </button>

                    <button
                      className="admin-primary-btn"
                      onClick={handleApprove}
                      disabled={processing}
                    >
                      {processing ? "Đang xử lý..." : "Duyệt gia hạn"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedExtension && (
        <div className="admin-modal-overlay">
          <div className="debt-extension-confirm">
            <div className="debt-extension-confirm__icon">!</div>

            <h2>Từ chối yêu cầu gia hạn?</h2>
            <p>
              Vui lòng nhập lý do rõ ràng để khách hàng biết vì sao yêu cầu gia
              hạn chưa được chấp thuận.
            </p>

            <form onSubmit={handleReject}>
              <label>
                Lý do từ chối
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Nhập lý do từ chối..."
                />
              </label>

              <label>
                Ghi chú nội bộ
                <textarea
                  value={rejectNote}
                  onChange={(event) => setRejectNote(event.target.value)}
                  placeholder="Nhập ghi chú nếu cần..."
                />
              </label>

              <div className="debt-extension-confirm__actions">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setShowRejectModal(false)}
                  disabled={processing}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="admin-primary-btn danger"
                  disabled={processing}
                >
                  {processing ? "Đang xử lý..." : "Xác nhận từ chối"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}