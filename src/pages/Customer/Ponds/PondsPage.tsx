import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { pondService } from "../../../services/pond.service";
import type { PondPayload } from "../../../services/pond.service";

import {
  customerProfileService,
} from "../../../services/customerProfile.service";
import type {
  CustomerProfile,
} from "../../../services/customerProfile.service";

import {
  cropSeasonService,
} from "../../../services/cropSeason.service";
import type {
  CropSeason,
} from "../../../services/cropSeason.service";

import { PondCard } from "./PondCard";
import type { Pond } from "./PondCard";
import { PondModal } from "./PondModal";
import { CropSeasonModal } from "./CropSeasonModal";
import { PondEmptyState } from "./PondEmptyState";

import {
  DebtRegistrationModal,
} from "../DebtRegistration";
import { confirmDialog } from "../../../utils/notify";

import "./PondsPage.css";

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDateOnly = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const diffDays = (fromDate: Date, toDate: Date) => {
  return Math.round((toDate.getTime() - fromDate.getTime()) / DAY_MS);
};

const validateCropSeasonDates = (seedValue: string, harvestValue: string) => {
  const seedDate = parseDateOnly(seedValue);

  if (!seedDate) {
    return "Vui lòng nhập ngày thả giống hợp lệ.";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysFromSeedToToday = diffDays(seedDate, today);

  if (daysFromSeedToToday < 0) {
    return "Ngày thả giống thực tế không được lớn hơn ngày hiện tại.";
  }

  if (daysFromSeedToToday > 90) {
    return "Ngày thả giống thực tế không được cách thời điểm hiện tại quá 90 ngày.";
  }

  if (harvestValue) {
    const harvestDate = parseDateOnly(harvestValue);

    if (!harvestDate) {
      return "Ngày thu hoạch dự kiến không hợp lệ.";
    }

    const daysFromSeedToHarvest = diffDays(seedDate, harvestDate);

    if (daysFromSeedToHarvest < 0) {
      return "Ngày thu hoạch dự kiến không được nhỏ hơn ngày thả giống.";
    }

    if (daysFromSeedToHarvest > 120) {
      return "Ngày thu hoạch dự kiến không được cách ngày thả giống quá 120 ngày.";
    }
  }

  return "";
};

const PondsPage: React.FC = () => {
  const navigate = useNavigate();

  const [ponds, setPonds] = useState<Pond[]>([]);
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [cropSeasons, setCropSeasons] = useState<CropSeason[]>([]);
  const [selectedPond, setSelectedPond] = useState<Pond | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const [errorModal, setErrorModal] = useState({
    open: false,
    title: "",
    message: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const [formData, setFormData] = useState<PondPayload>({
    ten_ao: "",
    dien_tich: 0,
    dia_chi_ao: "",
    loai_hinh_nuoi: "",
    trang_thai_ao: "dang_hoat_dong",
    id_tinh_thanh: null,
    id_phuong_xa: null,
    vi_do: null,
    kinh_do: null,
  });

  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropFormData, setCropFormData] = useState({
    ten_vu_nuoi: "",
    ngay_tha_giong: "",
    so_luong_giong: 0,
    ngay_thu_hoach_du_kien: "",
    ghi_chu: "",
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const getErrorMessage = (error: any) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Có lỗi xảy ra, vui lòng thử lại."
    );
  };

  const showError = (message: string, title = "Có lỗi xảy ra") => {
    setErrorModal({
      open: true,
      title,
      message,
    });
  };

  const closeErrorModal = () => {
    setErrorModal({
      open: false,
      title: "",
      message: "",
    });
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setIsUnauthorized(false);

      const pondRes = await pondService.getMyPonds();

      if (pondRes?.success === false) {
        showError(pondRes.message || "Không thể tải danh sách ao nuôi.");
        return;
      }

      if (pondRes?.success) {
        const fetchedPonds: Pond[] = pondRes.data || [];
        setPonds(fetchedPonds);

        if (fetchedPonds.length > 0) {
          setSelectedPond((current) => {
            if (
              current &&
              fetchedPonds.some((pond) => pond.id_ao === current.id_ao)
            ) {
              return (
                fetchedPonds.find((pond) => pond.id_ao === current.id_ao) ||
                fetchedPonds[0]
              );
            }

            return fetchedPonds[0];
          });
        } else {
          setSelectedPond(null);
        }
      }

      const profileRes =
        await customerProfileService.getMyCustomerProfiles();

      if (profileRes?.success) {
        setProfiles(profileRes.data || []);
      }
    } catch (error: any) {
      if (
        error?.response?.status === 401 ||
        error?.response?.data?.message === "Vui lòng đăng nhập"
      ) {
        setIsUnauthorized(true);
        return;
      }

      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loadCropSeasons = async (id_ao: number) => {
    try {
      const res =
        await cropSeasonService.getCropSeasonsByPond(id_ao);

      if (res?.success) {
        setCropSeasons(res.data || []);
      } else {
        setCropSeasons([]);
      }
    } catch (error: any) {
      setCropSeasons([]);
      showError(getErrorMessage(error));
    }
  };

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedPond?.id_ao) {
      void loadCropSeasons(selectedPond.id_ao);
    } else {
      setCropSeasons([]);
    }
  }, [selectedPond?.id_ao]);

  const activeCrop =
    cropSeasons.find(
      (crop) => crop.trang_thai === "dang_nuoi"
    ) || null;

  const currentProfile = activeCrop
    ? profiles.find(
        (profile) =>
          Number(profile.id_vu_nuoi) ===
          Number(activeCrop.id_vu_nuoi)
      ) || null
    : null;

  const isDebtApproved = currentProfile?.duoc_phep_tra_sau === true;

  const isWaitingAdmin =
    Boolean(currentProfile) &&
    currentProfile?.duoc_phep_tra_sau === false &&
    currentProfile?.trang_thai_ho_so !== "tu_choi";

  const formatCurrency = (
    value: number | string | undefined | null
  ) => {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
  };

  const getProfileButtonText = () => {
    if (!activeCrop) {
      return "Cần có vụ nuôi";
    }

    if (!currentProfile) {
      return "Thêm hồ sơ trả sau";
    }

    if (isWaitingAdmin) {
      return "Chờ admin duyệt";
    }

    return "Xem hồ sơ";
  };

  const getBannerStatusText = () => {
    if (!currentProfile) return "";

    if (isWaitingAdmin) {
      return "(Chờ duyệt)";
    }

    if (isDebtApproved) {
      return "(Đã duyệt)";
    }

    return "";
  };

  const handleProfileAction = () => {
    if (!selectedPond) {
      showError("Vui lòng chọn ao nuôi trước.");
      return;
    }

    if (!activeCrop) {
      showError(
        "Ao nuôi này chưa có vụ nuôi đang hoạt động. Vui lòng tạo vụ nuôi trước khi đăng ký mua trả sau."
      );
      return;
    }

    if (isDebtApproved) {
      navigate("/store");
      return;
    }

    if (isWaitingAdmin) {
      showError(
        "Hồ sơ đang chờ Admin duyệt hạn mức trả sau."
      );
      return;
    }

    if (currentProfile?.id_ho_so) {
      showError("Hồ sơ đã được gửi và đang chờ xử lý.");
      return;
    }

    setIsProfileModalOpen(true);
  };

  const handleOpenCreate = () => {
    setModalMode("create");

    setFormData({
      ten_ao: "",
      dien_tich: 0,
      dia_chi_ao: "",
      loai_hinh_nuoi: "",
      trang_thai_ao: "dang_hoat_dong",
      id_tinh_thanh: null,
      id_phuong_xa: null,
      vi_do: null,
      kinh_do: null,
    });

    setIsModalOpen(true);
  };

  const handleOpenEdit = (pond: Pond) => {
    setModalMode("edit");

    setFormData({
      ten_ao: pond.ten_ao,
      dien_tich: pond.dien_tich,
      dia_chi_ao: pond.dia_chi_ao || "",
      loai_hinh_nuoi: pond.loai_hinh_nuoi || "",
      trang_thai_ao: pond.trang_thai_ao,
      id_tinh_thanh: pond.id_tinh_thanh || null,
      id_phuong_xa: pond.id_phuong_xa || null,
      vi_do: pond.vi_do || null,
      kinh_do: pond.kinh_do || null,
    });

    setIsModalOpen(true);
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);

      if (modalMode === "create") {
        const res =
          await pondService.createPond(formData);

        if (res?.success === false) {
          showError(
            res.message || "Tạo ao nuôi thất bại."
          );
          return;
        }
      } else if (
        modalMode === "edit" &&
        selectedPond
      ) {
        const res = await pondService.updatePond(
          selectedPond.id_ao,
          formData
        );

        if (res?.success === false) {
          showError(
            res.message || "Cập nhật ao nuôi thất bại."
          );
          return;
        }

        if (res?.success && res.data) {
          setSelectedPond(res.data);
        }
      }

      setIsModalOpen(false);
      await loadInitialData();
    } catch (error: any) {
      showError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCropSeason = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!selectedPond) {
      showError(
        "Vui lòng chọn ao nuôi trước khi tạo vụ."
      );
      return;
    }

    const cropDateError = validateCropSeasonDates(
      cropFormData.ngay_tha_giong,
      cropFormData.ngay_thu_hoach_du_kien
    );

    if (cropDateError) {
      showError(cropDateError, "Dữ liệu vụ nuôi không hợp lệ");
      return;
    }

    try {
      const res =
        await cropSeasonService.createCropSeason({
          id_ao: selectedPond.id_ao,
          ...cropFormData,
        });

      if (res?.success === false) {
        showError(
          res.message || "Tạo vụ nuôi thất bại."
        );
        return;
      }

      if (res?.success) {
        setIsCropModalOpen(false);

        setCropFormData({
          ten_vu_nuoi: "",
          ngay_tha_giong: "",
          so_luong_giong: 0,
          ngay_thu_hoach_du_kien: "",
          ghi_chu: "",
        });

        await loadCropSeasons(selectedPond.id_ao);
      }
    } catch (error: any) {
      showError(getErrorMessage(error));
    }
  };

  const handleDebtRegistrationSuccess = async () => {
    setIsProfileModalOpen(false);

    await loadInitialData();

    if (selectedPond?.id_ao) {
      await loadCropSeasons(selectedPond.id_ao);
    }
  };

  const handleCloseCrop = async (
    id_vu_nuoi: number
  ) => {
    const confirmClose = await confirmDialog(
      "Bạn muốn kết thúc vụ nuôi hiện tại để tiến hành thu hoạch?"
    );

    if (!confirmClose) return;

    try {
      const res =
        await cropSeasonService.updateCropSeason(
          id_vu_nuoi,
          {
            trang_thai: "da_thu_hoach",
          }
        );

      if (res?.success === false) {
        showError(
          res.message || "Kết thúc vụ nuôi thất bại."
        );
        return;
      }

      if (res?.success && selectedPond) {
        await loadCropSeasons(selectedPond.id_ao);
      }
    } catch (error: any) {
      showError(getErrorMessage(error));
    }
  };

  const handleDelete = async (id_ao: number) => {
    const confirmDelete = await confirmDialog(
      "Bạn muốn xóa ao này chứ?"
    );

    if (!confirmDelete) return;

    try {
      const res = await pondService.deletePond(id_ao);

      if (res?.success === false) {
        showError(
          res.message || "Xóa ao thất bại.",
          "Không thể xóa ao nuôi"
        );
        return;
      }

      setSelectedPond(null);
      await loadInitialData();
    } catch (error: any) {
      showError(
        getErrorMessage(error),
        "Không thể xóa ao nuôi"
      );
    }
  };

  if (loading) {
    return (
      <div className="ponds-loading">
        Đang kết nối hệ thống dữ liệu...
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="unauthorized-card">
        <h2>Yêu cầu quyền truy cập</h2>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="btn-login-redirect"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  if (ponds.length === 0) {
    return (
      <>
        <PondEmptyState
          onAddClick={handleOpenCreate}
        />

        <PondModal
          isOpen={isModalOpen}
          mode="create"
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setIsModalOpen(false)}
        />

        {errorModal.open && (
          <div className="center-error-overlay">
            <div className="center-error-modal">
              <button
                type="button"
                className="center-error-close"
                onClick={closeErrorModal}
                aria-label="Đóng"
              >
                ×
              </button>

              <div className="center-error-icon">×</div>
              <h2>{errorModal.title}</h2>
              <p>{errorModal.message}</p>

              <button
                type="button"
                className="center-error-btn"
                onClick={closeErrorModal}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="ponds-container">
      <div className="financial-banner">
        <div className="banner-title">
          <h3>Hạn mức công nợ vật tư</h3>

          {currentProfile ? (
            <span className="banner-amount-display">
              Khả dụng:{" "}
              <strong>
                {isDebtApproved
                  ? formatCurrency(
                      currentProfile.dinh_muc_cong_no
                    )
                  : "0đ"}
              </strong>{" "}
              {getBannerStatusText()}
            </span>
          ) : (
            <p>
              Hỗ trợ vốn lưu động thanh toán trả sau
              theo chu kỳ từng vụ nuôi.
            </p>
          )}
        </div>

        <div className="banner-actions-group">
          {isDebtApproved ? (
            <button
              type="button"
              onClick={() => navigate("/store")}
              className="banner-btn"
            >
              Đặt vật tư ngay
            </button>
          ) : (
            <button
              type="button"
              onClick={handleProfileAction}
              className={
                isWaitingAdmin
                  ? "banner-btn-secondary"
                  : "banner-btn"
              }
              disabled={isWaitingAdmin}
            >
              {getProfileButtonText()}
            </button>
          )}
        </div>
      </div>

      <div className="ponds-grid">
        <aside className="aside-list">
          <h2>
            Danh sách ao nuôi ({ponds.length})
          </h2>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-create-pond"
          >
            + Thêm ao nuôi mới
          </button>

          <div className="cards-scroll">
            {ponds.map((item) => (
              <PondCard
                key={item.id_ao}
                pond={item}
                isActive={
                  selectedPond?.id_ao === item.id_ao
                }
                hasActiveCrop={
                  item.co_vu_dang_nuoi === true
                }
                onClick={() => setSelectedPond(item)}
              />
            ))}
          </div>
        </aside>

        <main className="main-detail">
          {selectedPond ? (
            <div>
              <div className="detail-banner">
                <img
                  src="https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=1000"
                  alt="Ao nuôi"
                />

                <div className="action-buttons">
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenEdit(selectedPond)
                    }
                    className="btn-edit"
                  >
                    <i className="fa-regular fa-pen-to-square" />
                    Sửa ao
                  </button>

                  {activeCrop ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleCloseCrop(
                          activeCrop.id_vu_nuoi
                        )
                      }
                      className="btn-close-season"
                    >
                      <i className="fa-solid fa-circle-stop" />
                      Kết thúc vụ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setIsCropModalOpen(true)
                      }
                      className="btn-new-season"
                    >
                      <i className="fa-solid fa-seedling" />
                      Thả giống vụ mới
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(selectedPond.id_ao)
                    }
                    className="btn-delete"
                  >
                    <i className="fa-regular fa-trash-can" />
                    Xóa ao
                  </button>
                </div>

                <div className="detail-banner-content">
                  <h1>{selectedPond.ten_ao}</h1>
                  <p>
                    {selectedPond.dia_chi_ao ||
                      "Chưa cập nhật địa chỉ"}{" "}
                    | Loài nuôi:{" "}
                    {selectedPond.loai_hinh_nuoi ||
                      "Chưa rõ"}
                  </p>
                </div>
              </div>

              <div className="specs-grid">
                <div className="spec-box">
                  <span>Diện tích</span>
                  <strong>
                    {Number(
                      selectedPond.dien_tich
                    ).toLocaleString("vi-VN")}{" "}
                    m²
                  </strong>
                </div>

                <div className="spec-box">
                  <span>Vị trí giao hàng</span>
                  <strong
                    style={{
                      fontSize: "13px",
                      color:
                        selectedPond.vi_do && selectedPond.kinh_do
                          ? "#0f766e"
                          : "#ef4444",
                    }}
                  >
                    {selectedPond.vi_do && selectedPond.kinh_do
                      ? "Đã có tọa độ"
                      : "Chưa có tọa độ"}
                  </strong>
                </div>

                <div className="spec-box">
                  <span>Vụ nuôi</span>
                  <strong
                    style={{
                      fontSize: "14px",
                      color: activeCrop
                        ? "#1e3a8a"
                        : "#ef4444",
                    }}
                  >
                    {activeCrop
                      ? activeCrop.ten_vu_nuoi
                      : "AO TRỐNG"}
                  </strong>
                </div>

                <div className="spec-box">
                  <span>Giống thả</span>
                  <strong>
                    {activeCrop?.so_luong_giong
                      ? `${Number(
                          activeCrop.so_luong_giong
                        ).toLocaleString(
                          "vi-VN"
                        )} con`
                      : "0 con"}
                  </strong>
                </div>

                <div className="spec-box">
                  <span>Mật độ nuôi</span>
                  <strong>
                    {activeCrop?.so_luong_giong &&
                    Number(selectedPond.dien_tich) > 0
                      ? `${Math.round(
                          Number(
                            activeCrop.so_luong_giong
                          ) /
                            Number(
                              selectedPond.dien_tich
                            )
                        )} con/m²`
                      : "0 con/m²"}
                  </strong>
                </div>

                <div className="spec-box">
                  <span>Ngày thu dự kiến</span>
                  <strong
                    style={{ fontSize: "13px" }}
                  >
                    {activeCrop?.ngay_thu_hoach_du_kien ||
                      "--/--/----"}
                  </strong>
                </div>
              </div>

              <div className="crop-seasons-section">
                <h3 className="section-title">
                  <i className="fa-solid fa-history" />
                  Lịch sử các vụ nuôi của ao
                </h3>

                {cropSeasons.length === 0 ? (
                  <p className="no-data-text">
                    Ao nuôi chưa từng có vụ nuôi nào.
                  </p>
                ) : (
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Tên vụ nuôi</th>
                          <th>Ngày thả giống</th>
                          <th>Số lượng giống</th>
                          <th>Trạng thái</th>
                          <th>Ghi chú</th>
                          <th>Mua hàng</th>
                        </tr>
                      </thead>

                      <tbody>
                        {cropSeasons.map((crop) => (
                          <tr key={crop.id_vu_nuoi}>
                            <td
                              style={{
                                fontWeight: 700,
                              }}
                            >
                              {crop.ten_vu_nuoi}
                            </td>

                            <td>
                              {crop.ngay_tha_giong ||
                                "Chưa cập nhật"}
                            </td>

                            <td>
                              {crop.so_luong_giong
                                ? `${Number(
                                    crop.so_luong_giong
                                  ).toLocaleString(
                                    "vi-VN"
                                  )} con`
                                : "--"}
                            </td>

                            <td>
                              <span
                                className={`table-badge ${
                                  crop.trang_thai ===
                                  "dang_nuoi"
                                    ? "badge-green"
                                    : crop.trang_thai ===
                                      "da_thu_hoach"
                                    ? "badge-blue"
                                    : "badge-red"
                                }`}
                              >
                                {crop.trang_thai ===
                                "dang_nuoi"
                                  ? "ĐANG NUÔI"
                                  : crop.trang_thai ===
                                    "da_thu_hoach"
                                  ? "ĐÃ THU HOẠCH"
                                  : "ĐÃ HỦY"}
                              </span>
                            </td>

                            <td>
                              {crop.ghi_chu || "-"}
                            </td>

                            <td>
                              <button
                                type="button"
                                className="btn-season-orders"
                                onClick={() =>
                                  navigate(
                                    `/ponds/crop-seasons/${crop.id_vu_nuoi}/orders`
                                  )
                                }
                              >
                                Xem mua hàng
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="ponds-no-selected">
              Vui lòng chọn ao nuôi.
            </div>
          )}
        </main>
      </div>

      <PondModal
        isOpen={isModalOpen}
        mode={modalMode}
        formData={formData}
        onChange={setFormData}
        onSubmit={handleSubmit}
        onClose={() => setIsModalOpen(false)}
      />

      <CropSeasonModal
        isOpen={isCropModalOpen}
        pondName={selectedPond?.ten_ao || ""}
        formData={cropFormData}
        onChange={setCropFormData}
        onSubmit={handleCreateCropSeason}
        onClose={() => setIsCropModalOpen(false)}
      />

      {selectedPond && activeCrop && (
        <DebtRegistrationModal
          isOpen={isProfileModalOpen}
          pondId={selectedPond.id_ao}
          cropSeasonId={activeCrop.id_vu_nuoi}
          pondName={selectedPond.ten_ao}
          cropName={activeCrop.ten_vu_nuoi}
          defaultPondArea={selectedPond.dien_tich}
          defaultPondAddress={
            selectedPond.dia_chi_ao || ""
          }
          onClose={() =>
            setIsProfileModalOpen(false)
          }
          onSuccess={
            handleDebtRegistrationSuccess
          }
        />
      )}

      {errorModal.open && (
        <div className="center-error-overlay">
          <div className="center-error-modal">
            <button
              type="button"
              className="center-error-close"
              onClick={closeErrorModal}
              aria-label="Đóng"
            >
              ×
            </button>

            <div className="center-error-icon">×</div>

            <h2>{errorModal.title}</h2>
            <p>{errorModal.message}</p>

            <button
              type="button"
              className="center-error-btn"
              onClick={closeErrorModal}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PondsPage;
