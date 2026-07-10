import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  contractService,
  type ContractItem,
  type ContractStatus,
} from "../../services/contract.service";
import "./StaffContractPage.css";

const statusLabel: Record<ContractStatus, string> = {
  cho_ky: "Chờ khách ký",
  cho_xac_nhan: "Chờ Admin xác nhận",
  da_ky: "Đã xác nhận",
  huy: "Đã hủy",
};

const statusClass: Record<ContractStatus, string> = {
  cho_ky: "waiting",
  cho_xac_nhan: "pending",
  da_ky: "success",
  huy: "danger",
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
};

const formatMoney = (value?: number | string | null) => {
  return Number(value || 0).toLocaleString("vi-VN") + " đ";
};

export default function StaffContractPage() {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<"tat_ca" | ContractStatus>("tat_ca");
  const [alert, setAlert] = useState("");

  const [signedImage, setSignedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [ngayKy, setNgayKy] = useState(new Date().toISOString().slice(0, 10));
  const [ghiChu, setGhiChu] = useState("");

  const loadContracts = async () => {
    try {
      setLoading(true);
      const data = await contractService.getStaffContracts();
      setContracts(data || []);

      if (!selectedContract && data?.length) {
        setSelectedContract(data[0]);
      }
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể tải hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredContracts = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return contracts.filter((contract) => {
      const customerName =
        contract.HoSoKhachHang?.NguoiDung?.ho_ten?.toLowerCase() || "";
      const phone =
        contract.HoSoKhachHang?.NguoiDung?.so_dien_thoai?.toLowerCase() || "";
      const profileId = String(contract.id_ho_so || "");
      const contractId = String(contract.id_hop_dong || "");

      const matchKeyword =
        !search ||
        customerName.includes(search) ||
        phone.includes(search) ||
        profileId.includes(search) ||
        contractId.includes(search);

      const matchStatus =
        status === "tat_ca" || contract.trang_thai === status;

      return matchKeyword && matchStatus;
    });
  }, [contracts, keyword, status]);

  const stats = useMemo(() => {
    return {
      total: contracts.length,
      waiting: contracts.filter((item) => item.trang_thai === "cho_ky").length,
      pending: contracts.filter((item) => item.trang_thai === "cho_xac_nhan")
        .length,
      done: contracts.filter((item) => item.trang_thai === "da_ky").length,
    };
  }, [contracts]);

  const handleSelectContract = (contract: ContractItem) => {
    setSelectedContract(contract);
    setSignedImage(null);
    setGhiChu(contract.ghi_chu || "");
    setNgayKy(new Date().toISOString().slice(0, 10));

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAlert("Vui lòng chọn file ảnh hợp đồng đã ký");
      event.target.value = "";
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSignedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleUpload = async () => {
    if (!selectedContract) {
      setAlert("Vui lòng chọn hợp đồng");
      return;
    }

    if (!signedImage) {
      setAlert("Vui lòng chọn ảnh hợp đồng đã ký");
      return;
    }

    try {
      setSubmitting(true);

      const updated = await contractService.uploadSignedImage(
        selectedContract.id_hop_dong,
        {
          anh_hop_dong_da_ky: signedImage,
          ngay_ky: ngayKy,
          ghi_chu: ghiChu,
        }
      );

      setAlert("Đã upload ảnh hợp đồng đã ký và gửi Admin xác nhận");
      setSelectedContract(updated);
      setSignedImage(null);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }

      await loadContracts();
    } catch (error: any) {
      setAlert(
        error?.response?.data?.message || "Không thể upload ảnh hợp đồng"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="staff-contract-page">
      <div className="staff-contract-hero">
        <div>
          <p>Nhân viên định mức</p>
          <h1>Hợp đồng cần ký</h1>
          <span>
            Xem hợp đồng do Admin tạo, đi ký tay với khách hàng và upload ảnh
            hợp đồng đã ký để Admin xác nhận.
          </span>
        </div>

        <button type="button" onClick={loadContracts} disabled={loading}>
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {alert && (
        <div className="staff-contract-alert">
          <span>{alert}</span>
          <button type="button" onClick={() => setAlert("")}>
            ×
          </button>
        </div>
      )}

      <div className="staff-contract-stats">
        <div>
          <span>Tổng hợp đồng</span>
          <strong>{stats.total}</strong>
        </div>
        <div>
          <span>Chờ ký</span>
          <strong>{stats.waiting}</strong>
        </div>
        <div>
          <span>Chờ xác nhận</span>
          <strong>{stats.pending}</strong>
        </div>
        <div>
          <span>Đã xác nhận</span>
          <strong>{stats.done}</strong>
        </div>
      </div>

      <div className="staff-contract-layout">
        <section className="staff-contract-list-card">
          <div className="staff-contract-toolbar">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm mã HĐ, mã hồ sơ, khách hàng, SĐT..."
            />

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "tat_ca" | ContractStatus)
              }
            >
              <option value="tat_ca">Tất cả trạng thái</option>
              <option value="cho_ky">Chờ khách ký</option>
              <option value="cho_xac_nhan">Chờ Admin xác nhận</option>
              <option value="da_ky">Đã xác nhận</option>
              <option value="huy">Đã hủy</option>
            </select>
          </div>

          <div className="staff-contract-list">
            {loading ? (
              <div className="staff-contract-empty">Đang tải hợp đồng...</div>
            ) : filteredContracts.length === 0 ? (
              <div className="staff-contract-empty">
                Không có hợp đồng phù hợp.
              </div>
            ) : (
              filteredContracts.map((contract) => {
                const profile = contract.HoSoKhachHang;
                const customer = profile?.NguoiDung;
                const isActive =
                  selectedContract?.id_hop_dong === contract.id_hop_dong;

                return (
                  <button
                    type="button"
                    key={contract.id_hop_dong}
                    className={
                      isActive
                        ? "staff-contract-item active"
                        : "staff-contract-item"
                    }
                    onClick={() => handleSelectContract(contract)}
                  >
                    <div className="staff-contract-item__top">
                      <strong>HĐ #{contract.id_hop_dong}</strong>
                      <span className={`contract-status ${statusClass[contract.trang_thai]}`}>
                        {statusLabel[contract.trang_thai]}
                      </span>
                    </div>

                    <p>{customer?.ho_ten || "Khách hàng"}</p>

                    <div className="staff-contract-item__meta">
                      <span>HS #{contract.id_ho_so}</span>
                      <span>{customer?.so_dien_thoai || "—"}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="staff-contract-detail-card">
          {!selectedContract ? (
            <div className="staff-contract-empty large">
              Chọn hợp đồng để xem chi tiết.
            </div>
          ) : (
            <>
              <div className="staff-contract-detail-head">
                <div>
                  <p>Chi tiết hợp đồng</p>
                  <h2>HĐ #{selectedContract.id_hop_dong}</h2>
                </div>

                <span
                  className={`contract-status ${
                    statusClass[selectedContract.trang_thai]
                  }`}
                >
                  {statusLabel[selectedContract.trang_thai]}
                </span>
              </div>

              <div className="staff-contract-info-grid">
                <div>
                  <span>Khách hàng</span>
                  <strong>
                    {selectedContract.HoSoKhachHang?.NguoiDung?.ho_ten || "—"}
                  </strong>
                </div>

                <div>
                  <span>Số điện thoại</span>
                  <strong>
                    {selectedContract.HoSoKhachHang?.NguoiDung
                      ?.so_dien_thoai || "—"}
                  </strong>
                </div>

                <div>
                  <span>Ao nuôi</span>
                  <strong>
                    {selectedContract.HoSoKhachHang?.AoNuoi?.ten_ao || "—"}
                  </strong>
                </div>

                <div>
                  <span>Vụ nuôi</span>
                  <strong>
                    {selectedContract.HoSoKhachHang?.VuNuoi?.ten_vu_nuoi ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Hạn mức</span>
                  <strong>
                    {formatMoney(
                      selectedContract.HoSoKhachHang?.dinh_muc_cong_no
                    )}
                  </strong>
                </div>

                <div>
                  <span>Ngày tạo</span>
                  <strong>{formatDate(selectedContract.ngay_tao)}</strong>
                </div>

                <div>
                  <span>Ngày ký</span>
                  <strong>{formatDate(selectedContract.ngay_ky)}</strong>
                </div>

                <div>
                  <span>Ngày upload</span>
                  <strong>{formatDate(selectedContract.ngay_upload)}</strong>
                </div>
              </div>

              {selectedContract.dieu_khoan_bo_sung && (
                <div className="staff-contract-terms">
                  <span>Điều khoản bổ sung</span>
                  <p>{selectedContract.dieu_khoan_bo_sung}</p>
                </div>
              )}

              <div className="staff-contract-pdf-box">
                <div>
                  <strong>Hợp đồng mẫu</strong>
                  <span>
                    PDF do Admin tạo. Nhân viên dùng bản này để in và đi ký.
                  </span>
                </div>

                {selectedContract.file_hop_dong_mau ? (
                  <a
                    href={selectedContract.file_hop_dong_mau}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Xem PDF
                  </a>
                ) : (
                  <button type="button" disabled>
                    Chưa có PDF
                  </button>
                )}
              </div>

              {selectedContract.anh_hop_dong_da_ky && (
                <div className="staff-contract-signed-preview">
                  <span>Ảnh hợp đồng đã upload</span>
                  <img
                    src={selectedContract.anh_hop_dong_da_ky}
                    alt="Hợp đồng đã ký"
                  />
                </div>
              )}

              {selectedContract.trang_thai !== "da_ky" &&
                selectedContract.trang_thai !== "huy" && (
                  <div className="staff-contract-upload-box">
                    <h3>Upload ảnh hợp đồng đã ký</h3>

                    <label>
                      Ngày ký
                      <input
                        type="date"
                        value={ngayKy}
                        onChange={(event) => setNgayKy(event.target.value)}
                      />
                    </label>

                    <label>
                      Ảnh hợp đồng đã ký
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>

                    {previewUrl && (
                      <div className="staff-contract-preview-upload">
                        <img src={previewUrl} alt="Ảnh xem trước" />
                      </div>
                    )}

                    <label>
                      Ghi chú
                      <textarea
                        value={ghiChu}
                        onChange={(event) => setGhiChu(event.target.value)}
                        placeholder="Nhập ghi chú khi ký hợp đồng nếu có..."
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={submitting}
                    >
                      {submitting ? "Đang gửi..." : "Gửi Admin xác nhận"}
                    </button>
                  </div>
                )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}