import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ImagePlus,
  MapPin,
  PackageOpen,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deliveryService,
  type DeliveryOrderItem,
  type DeliveryTask,
} from "../../services/delivery.service";
import { uploadService } from "../../services/upload.service";
import {
  deliveryStatusLabels,
  formatDate,
  formatDateTime,
  formatMoney,
  getCustomerName,
  getCustomerPhone,
  getPaymentLabel,
  getProductImage,
} from "./delivery.helpers";
import DeliveryPageShell from "./components/DeliveryPageShell";
import type { DeliveryUserInfo } from "./components/DeliveryHeader";
import "./DeliveryDashboardPage.css";
import "./DeliveryOrdersPage.css";
import "./DeliveryOrderDetailPage.css";

type UpdateMode = "success" | "fail";

interface UpdateDeliveryForm {
  mode: UpdateMode;
  receiptFile: File | null;
  confirmationFile: File | null;
  note: string;
  failReason: string;
}

const initialUpdateForm: UpdateDeliveryForm = {
  mode: "success",
  receiptFile: null,
  confirmationFile: null,
  note: "",
  failReason: "",
};

const getStoredUser = (): DeliveryUserInfo => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}") as DeliveryUserInfo;
  } catch {
    return {};
  }
};

const timeline = [
  {
    key: "cho_giao",
    label: "Chờ giao",
    description: "Đơn đã được phân công cho nhân viên.",
    icon: Clock3,
  },
  {
    key: "dang_giao",
    label: "Đang giao",
    description: "Nhân viên đã bắt đầu giao hàng.",
    icon: Truck,
  },
  {
    key: "giao_thanh_cong",
    label: "Hoàn thành",
    description: "Đơn đã được bàn giao thành công.",
    icon: CheckCircle2,
  },
  {
    key: "giao_that_bai",
    label: "Thất bại",
    description: "Đơn giao không thành công.",
    icon: XCircle,
  },
];

const statusOrder = ["cho_giao", "dang_giao", "giao_thanh_cong"];

const isTimelineDone = (status: string, currentStatus?: string) => {
  if (currentStatus === "giao_that_bai") {
    return status === "cho_giao" || status === "dang_giao" || status === "giao_that_bai";
  }

  return statusOrder.indexOf(status) <= statusOrder.indexOf(String(currentStatus));
};

function InfoBlock({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="delivery-detail-info-block">
      <span>{label}</span>
      <strong>{value || "Chưa cập nhật"}</strong>
    </div>
  );
}

function ProductTable({ items }: { items: DeliveryOrderItem[] }) {
  if (items.length === 0) {
    return (
      <div className="delivery-products-empty">
        <PackageOpen size={38} />
        <strong>Chưa có danh sách sản phẩm</strong>
        <p>Đơn giao này chưa có chi tiết sản phẩm hoặc dữ liệu chưa được đồng bộ.</p>
      </div>
    );
  }

  return (
    <div className="delivery-products-table-wrap">
      <table className="delivery-products-table">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const imageUrl = getProductImage(item.SanPham?.hinh_anh);

            return (
              <tr key={item.id_chi_tiet || item.id_san_pham}>
                <td>
                  <div className="delivery-product-cell">
                    <div className="delivery-product-image">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.SanPham?.ten_san_pham || "Sản phẩm"}
                        />
                      ) : (
                        <PackageOpen size={22} />
                      )}
                    </div>
                    <div>
                      <strong>
                        {item.SanPham?.ten_san_pham || `Sản phẩm #${item.id_san_pham}`}
                      </strong>
                      <span>{item.SanPham?.don_vi_tinh || "Sản phẩm"}</span>
                    </div>
                  </div>
                </td>
                <td>{item.so_luong_dat}</td>
                <td>{formatMoney(item.gia_ban)}</td>
                <td>{formatMoney(item.thanh_tien)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UploadField({
  label,
  required,
  file,
  onChange,
}: {
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] || null);
  };

  return (
    <label className="delivery-upload-field">
      <span>
        {label}
        {required ? <b>*</b> : null}
      </span>
      <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} />
      <div className="delivery-upload-box">
        <ImagePlus size={22} />
        <strong>{file ? file.name : "Chụp hoặc tải ảnh lên"}</strong>
        <small>JPG, PNG hoặc ảnh chụp từ camera</small>
      </div>
    </label>
  );
}

export default function DeliveryOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<DeliveryTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState<UpdateDeliveryForm>(initialUpdateForm);

  const user = getStoredUser();

  const fetchDelivery = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setMessage("");
      const data = await deliveryService.getDeliveryById(id);
      setDelivery(data);
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      setMessage(apiError.response?.data?.message || "Không thể tải chi tiết giao hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelivery();
  }, [id]);

  const products = useMemo(
    () => delivery?.DonHang?.ChiTietDonHangs || [],
    [delivery]
  );

  const pond = delivery?.DonHang?.AoNuoi || delivery?.DonHang?.VuNuoi?.AoNuoi;
  const isPostpaidOrder = delivery?.DonHang?.hinh_thuc_thanh_toan === "tra_sau";

  const openUpdateModal = (mode: UpdateMode) => {
    setUpdateForm({ ...initialUpdateForm, mode });
    setIsUpdateModalOpen(true);
    setMessage("");
  };

  const closeUpdateModal = () => {
    if (submitting) return;
    setIsUpdateModalOpen(false);
    setUpdateForm(initialUpdateForm);
  };

  const handleStartDelivery = async () => {
    if (!delivery) return;

    try {
      setSubmitting(true);
      setMessage("");
      const updated = await deliveryService.startDelivery(delivery.id_giao_hang);
      setDelivery(updated);
      setMessage("Đã bắt đầu giao đơn hàng.");
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      setMessage(apiError.response?.data?.message || "Không thể bắt đầu giao.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!delivery) return;

    try {
      setSubmitting(true);
      setMessage("");

      if (updateForm.mode === "success") {
        if (!updateForm.receiptFile) {
          throw new Error("Vui lòng chụp hoặc tải ảnh biên nhận giao hàng.");
        }

        if (isPostpaidOrder && !updateForm.confirmationFile) {
          throw new Error("Vui lòng chụp hoặc tải giấy xác nhận trả sau.");
        }

        const receipt = await uploadService.uploadSingle(updateForm.receiptFile);
        const confirmation = updateForm.confirmationFile
          ? await uploadService.uploadSingle(updateForm.confirmationFile)
          : null;

        const updated = await deliveryService.completeDelivery(delivery.id_giao_hang, {
          anh_bien_nhan: receipt.secure_url || receipt.url,
          anh_hop_dong: confirmation?.secure_url || confirmation?.url,
          ghi_chu: updateForm.note.trim(),
        });

        setDelivery(updated);
        setMessage("Đã xác nhận giao hàng thành công.");
      } else {
        if (!updateForm.failReason.trim()) {
          throw new Error("Vui lòng nhập lý do giao thất bại.");
        }

        const updated = await deliveryService.failDelivery(delivery.id_giao_hang, {
          ly_do_that_bai: updateForm.failReason.trim(),
          ghi_chu: updateForm.note.trim(),
        });

        setDelivery(updated);
        setMessage("Đã cập nhật giao hàng thất bại.");
      }

      setIsUpdateModalOpen(false);
      setUpdateForm(initialUpdateForm);
    } catch (error: unknown) {
      const apiError = error as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      setMessage(
        apiError.response?.data?.message ||
          apiError.message ||
          "Không thể cập nhật giao hàng."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DeliveryPageShell
      title="Chi tiết giao hàng"
      subtitle="Xem thông tin khách hàng, đơn hàng và tiến độ giao."
      user={user}
    >
      <button
        type="button"
        className="delivery-back-btn"
        onClick={() => navigate("/delivery/orders")}
      >
        <ArrowLeft size={18} />
        Quay lại danh sách
      </button>

      {message && (
        <div className="delivery-alert">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="delivery-detail-loading">Đang tải chi tiết giao hàng...</div>
      ) : !delivery ? (
        <div className="delivery-detail-loading">Không tìm thấy phiếu giao.</div>
      ) : (
        <main className="delivery-detail-layout">
          <section className="delivery-detail-main">
            <div className="delivery-detail-title-card">
              <div>
                <span className={`delivery-status ${delivery.trang_thai}`}>
                  {deliveryStatusLabels[delivery.trang_thai]}
                </span>
                <h2>Đơn hàng #{delivery.id_don_hang}</h2>
                <p>
                  Phiếu giao #{delivery.id_giao_hang} -{" "}
                  {formatDateTime(delivery.thoi_gian_giao)}
                </p>
              </div>
              <strong>{formatMoney(delivery.DonHang?.tong_thanh_toan)}</strong>
            </div>

            <section className="delivery-detail-card">
              <h3>Thông tin khách hàng</h3>
              <div className="delivery-detail-info-grid">
                <InfoBlock label="Họ tên" value={getCustomerName(delivery)} />
                <InfoBlock label="SĐT" value={getCustomerPhone(delivery)} />
                <InfoBlock
                  label="Địa chỉ"
                  value={delivery.DonHang?.dia_chi_giao_hang}
                />
              </div>

              {delivery.DonHang?.dia_chi_giao_hang && (
                <a
                  className="delivery-map-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    delivery.DonHang.dia_chi_giao_hang
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin size={18} />
                  Mở địa chỉ trên bản đồ
                </a>
              )}
            </section>

            <section className="delivery-detail-card">
              <h3>Thông tin vụ nuôi</h3>
              <div className="delivery-detail-info-grid">
                <InfoBlock
                  label="Ao nuôi"
                  value={pond?.ten_ao}
                />
                <InfoBlock
                  label="Vụ nuôi"
                  value={delivery.DonHang?.VuNuoi?.ten_vu_nuoi}
                />
                <InfoBlock
                  label="Địa chỉ ao"
                  value={pond?.dia_chi_ao}
                />
              </div>
            </section>

            <section className="delivery-detail-card">
              <h3>Thông tin đơn</h3>
              <div className="delivery-detail-info-grid">
                <InfoBlock label="Mã đơn" value={`#${delivery.id_don_hang}`} />
                <InfoBlock
                  label="Ngày đặt"
                  value={formatDate(delivery.DonHang?.ngay_dat)}
                />
                <InfoBlock
                  label="Thanh toán"
                  value={getPaymentLabel(delivery.DonHang?.hinh_thuc_thanh_toan)}
                />
                <InfoBlock
                  label="Tổng tiền"
                  value={formatMoney(delivery.DonHang?.tong_thanh_toan)}
                />
                <InfoBlock label="Ghi chú" value={delivery.DonHang?.ghi_chu} />
              </div>
            </section>

            <section className="delivery-detail-card">
              <h3>Danh sách sản phẩm</h3>
              <ProductTable items={products} />
            </section>
          </section>

          <aside className="delivery-detail-side">
            <section className="delivery-detail-card">
              <h3>Timeline trạng thái</h3>
              <div className="delivery-timeline">
                {timeline.map((item) => {
                  const Icon = item.icon;
                  const isDone = isTimelineDone(item.key, delivery.trang_thai);
                  const isCurrent = item.key === delivery.trang_thai;

                  return (
                    <div
                      className={`delivery-timeline-item ${
                        isDone ? "is-done" : ""
                      } ${isCurrent ? "is-current" : ""}`}
                      key={item.key}
                    >
                      <div className="delivery-timeline-icon">
                        <Icon size={18} />
                      </div>
                      <div>
                        <strong>{item.label}</strong>
                        <span>{item.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="delivery-detail-card">
              <h3>Hành động</h3>
              {delivery.trang_thai === "cho_giao" ? (
                <button
                  type="button"
                  className="delivery-start-btn"
                  onClick={handleStartDelivery}
                  disabled={submitting}
                >
                  <Truck size={18} />
                  {submitting ? "Đang cập nhật..." : "Bắt đầu giao"}
                </button>
              ) : delivery.trang_thai === "dang_giao" ? (
                <div className="delivery-action-stack">
                  <button
                    type="button"
                    className="delivery-start-btn"
                    onClick={() => openUpdateModal("success")}
                    disabled={submitting}
                  >
                    <CheckCircle2 size={18} />
                    Giao thành công
                  </button>
                  <button
                    type="button"
                    className="delivery-fail-btn"
                    onClick={() => openUpdateModal("fail")}
                    disabled={submitting}
                  >
                    <XCircle size={18} />
                    Giao thất bại
                  </button>
                </div>
              ) : (
                <p className="delivery-action-note">
                  Trạng thái hiện tại:{" "}
                  <strong>{deliveryStatusLabels[delivery.trang_thai]}</strong>
                </p>
              )}
            </section>
          </aside>
        </main>
      )}

      {isUpdateModalOpen && delivery && (
        <div className="delivery-update-overlay" role="presentation">
          <form className="delivery-update-modal" onSubmit={handleSubmitUpdate}>
            <div className="delivery-update-head">
              <div>
                <span>Cập nhật giao hàng</span>
                <h3>Đơn hàng #{delivery.id_don_hang}</h3>
                <p>
                  Thanh toán: {getPaymentLabel(delivery.DonHang?.hinh_thuc_thanh_toan)}
                </p>
              </div>
              <button type="button" onClick={closeUpdateModal} disabled={submitting}>
                <X size={20} />
              </button>
            </div>

            <div className="delivery-update-choice">
              <label className={updateForm.mode === "success" ? "is-active" : ""}>
                <input
                  type="radio"
                  name="delivery-update-mode"
                  checked={updateForm.mode === "success"}
                  onChange={() => setUpdateForm((prev) => ({ ...prev, mode: "success" }))}
                />
                <CheckCircle2 size={20} />
                <span>Giao thành công</span>
              </label>
              <label className={updateForm.mode === "fail" ? "is-active is-danger" : ""}>
                <input
                  type="radio"
                  name="delivery-update-mode"
                  checked={updateForm.mode === "fail"}
                  onChange={() => setUpdateForm((prev) => ({ ...prev, mode: "fail" }))}
                />
                <XCircle size={20} />
                <span>Giao thất bại</span>
              </label>
            </div>

            {updateForm.mode === "success" ? (
              <div className="delivery-update-grid">
                <UploadField
                  label="Ảnh biên nhận giao hàng"
                  required
                  file={updateForm.receiptFile}
                  onChange={(file) =>
                    setUpdateForm((prev) => ({ ...prev, receiptFile: file }))
                  }
                />

                {isPostpaidOrder && (
                  <UploadField
                    label="Giấy xác nhận trả sau"
                    required
                    file={updateForm.confirmationFile}
                    onChange={(file) =>
                      setUpdateForm((prev) => ({ ...prev, confirmationFile: file }))
                    }
                  />
                )}
              </div>
            ) : (
              <label className="delivery-update-field">
                <span>Lý do giao thất bại *</span>
                <textarea
                  value={updateForm.failReason}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      failReason: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Ví dụ: khách hẹn lại, không liên hệ được..."
                />
              </label>
            )}

            <label className="delivery-update-field">
              <span>Ghi chú</span>
              <textarea
                value={updateForm.note}
                onChange={(event) =>
                  setUpdateForm((prev) => ({ ...prev, note: event.target.value }))
                }
                rows={3}
                placeholder="Ghi chú thêm cho admin nếu có..."
              />
            </label>

            <div className="delivery-update-actions">
              <button type="button" onClick={closeUpdateModal} disabled={submitting}>
                Hủy
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu cập nhật"}
              </button>
            </div>
          </form>
        </div>
      )}
    </DeliveryPageShell>
  );
}
