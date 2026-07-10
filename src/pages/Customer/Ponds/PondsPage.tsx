import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { pondService } from "../../../services/pond.service";
import type { PondPayload } from "../../../services/pond.service";

import { customerProfileService } from "../../../services/customerProfile.service";
import type { CustomerProfile } from "../../../services/customerProfile.service";

import { cropSeasonService } from "../../../services/cropSeason.service";
import type { CropSeason } from "../../../services/cropSeason.service";

import { PondCard } from "./PondCard";
import type { Pond } from "./PondCard";
import { PondModal } from "./PondModal";
import { CropSeasonModal } from "./CropSeasonModal";
import { PondEmptyState } from "./PondEmptyState";
import { DebtRegistrationModal } from "../DebtRegistration";

import "./PondsPage.css";

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
  const [profileNote, setProfileNote] = useState("");

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
        const fetchedPonds = pondRes.data || [];
        setPonds(fetchedPonds);

        if (fetchedPonds.length > 0) {
          if (
            !selectedPond ||
            !fetchedPonds.some((p: Pond) => p.id_ao === selectedPond.id_ao)
          ) {
            setSelectedPond(fetchedPonds[0]);
          }
        } else {
          setSelectedPond(null);
        }
      }

      const profileRes = await customerProfileService.getMyCustomerProfiles();

      if (profileRes?.success) {
        setProfiles(profileRes.data || []);
      }
    } catch (error: any) {
      if (
        error.response?.status === 401 ||
        error.response?.data?.message === "Vui lòng đăng nhập"
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
      const res = await cropSeasonService.getCropSeasonsByPond(id_ao);

      if (res.success) {
        setCropSeasons(res.data || []);
      }
    } catch (error: any) {
      showError(getErrorMessage(error));
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedPond) {
      loadCropSeasons(selectedPond.id_ao);
    } else {
      setCropSeasons([]);
    }
  }, [selectedPond]);

  const activeCrop = cropSeasons.find((c) => c.trang_thai === "dang_nuoi");

  const currentProfile = activeCrop
    ? profiles.find(
      (p) => Number(p.id_vu_nuoi) === Number(activeCrop.id_vu_nuoi)
    )
    : null;

  const isDebtApproved =
    currentProfile?.trang_thai_xac_thuc === "da_xac_thuc" &&
    currentProfile?.duoc_phep_tra_sau === true;

  const isWaitingAdmin =
    currentProfile?.trang_thai_xac_thuc === "da_xac_thuc" &&
    currentProfile?.duoc_phep_tra_sau === false;

  const formatCurrency = (value: number | string | undefined | null) => {
    return `${Number(value || 0).toLocaleString()}đ`;
  };

  const getProfileButtonText = () => {
    if (!currentProfile) return "Thêm hồ sơ trả sau";

    if (currentProfile.trang_thai_xac_thuc === "that_bai") {
      return "Xác thực lại";
    }

    if (currentProfile.trang_thai_xac_thuc === "chua_xac_thuc") {
      return "Tiếp tục xác thực";
    }

    if (isWaitingAdmin) {
      return "Chờ admin duyệt";
    }

    return "Xem hồ sơ";
  };

  const getBannerStatusText = () => {
    if (!currentProfile) return "";

    if (currentProfile.trang_thai_xac_thuc === "that_bai") {
      return "(Xác thực thất bại)";
    }

    if (currentProfile.trang_thai_xac_thuc === "chua_xac_thuc") {
      return "(Chưa xác thực)";
    }

    if (isWaitingAdmin) {
      return "(Chờ duyệt)";
    }

    if (isDebtApproved) {
      return "(Đã duyệt)";
    }

    return "";
  };

  const handleProfileAction = () => {
    if (isDebtApproved) {
      navigate("/store");
      return;
    }

    if (isWaitingAdmin) {
      showError("Hồ sơ đã xác thực. Vui lòng chờ admin duyệt hạn mức trả sau.");
      return;
    }

    if (currentProfile?.id_ho_so) {
      navigate(`/face-verification/${currentProfile.id_ho_so}`);
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
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);


      if (modalMode === "create") {
        const res = await pondService.createPond(formData);

        if (res?.success === false) {
          showError(res.message || "Tạo ao nuôi thất bại.");
          return;
        }
      } else if (modalMode === "edit" && selectedPond) {
        const res = await pondService.updatePond(selectedPond.id_ao, formData);

        if (res?.success === false) {
          showError(res.message || "Cập nhật ao nuôi thất bại.");
          return;
        }

        if (res.success) {
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

  const handleCreateCropSeason = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPond) {
      showError("Vui lòng chọn ao nuôi trước khi tạo vụ.");
      return;
    }

    try {


      const res = await cropSeasonService.createCropSeason({
        id_ao: selectedPond.id_ao,
        ...cropFormData,
      });

      if (res?.success === false) {
        showError(res.message || "Tạo vụ nuôi thất bại.");
        return;
      }

      if (res.success) {
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

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPond || !activeCrop) {
      showError("Vui lòng chọn ao nuôi có vụ nuôi đang hoạt động.");
      return;
    }

    try {


      const res = await customerProfileService.createCustomerProfile({
        id_ao: selectedPond.id_ao,
        id_vu_nuoi: activeCrop.id_vu_nuoi,
        ghi_chu: profileNote,
      });

      if (res?.success === false) {
        showError(res.message || "Tạo hồ sơ khách hàng thất bại.");
        return;
      }

      if (res.success) {
        setIsProfileModalOpen(false);
        setProfileNote("");

        const idHoSo = res.data?.id_ho_so;

        if (idHoSo) {
          navigate(`/face-verification/${idHoSo}`);
          return;
        }

        await loadInitialData();
      }
    } catch (error: any) {
      showError(getErrorMessage(error));
    }
  };

  const handleCloseCrop = async (id_vu_nuoi: number) => {
    const confirmClose = window.confirm(
      "Bạn muốn kết thúc vụ nuôi hiện tại để tiến hành thu hoạch?"
    );

    if (!confirmClose) return;

    try {



      const res = await cropSeasonService.updateCropSeason(id_vu_nuoi, {
        trang_thai: "da_thu_hoach",
      });

      if (res?.success === false) {
        showError(res.message || "Kết thúc vụ nuôi thất bại.");
        return;
      }

      if (res.success && selectedPond) {
        await loadCropSeasons(selectedPond.id_ao);
      }
    } catch (error: any) {
      showError(getErrorMessage(error));
    }
  };

  const handleDelete = async (id_ao: number) => {
    const confirmDelete = window.confirm("Bạn muốn xóa ao này chứ?");
    if (!confirmDelete) return;

    try {

      const res = await pondService.deletePond(id_ao);

      if (res?.success === false) {
        showError(res.message || "Xóa ao thất bại.", "Không thể xóa ao nuôi");
        return;
      }

      setSelectedPond(null);
      await loadInitialData();
    } catch (error: any) {
      showError(getErrorMessage(error), "Không thể xóa ao nuôi");
    }
  };

  if (loading) {
    return <div className="ponds-loading">Đang kết nối hệ thống dữ liệu...</div>;
  }

  if (isUnauthorized) {
    return (
      <div className="unauthorized-card">
        <h2>Yêu cầu quyền truy cập</h2>
        <button onClick={() => navigate("/login")} className="btn-login-redirect">
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  if (ponds.length === 0) {
    return (
      <>


        <PondEmptyState onAddClick={handleOpenCreate} />

        <PondModal
          isOpen={isModalOpen}
          mode="create"
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setIsModalOpen(false)}
        />
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
                  ? formatCurrency(currentProfile.dinh_muc_cong_no)
                  : "0đ"}
              </strong>{" "}
              {getBannerStatusText()}
            </span>
          ) : (
            <p>Hỗ trợ vốn lưu động thanh toán trả sau theo chu kỳ từng vụ nuôi.</p>
          )}
        </div>

        <div className="banner-actions-group">
          {isDebtApproved ? (
            <button onClick={() => navigate("/store")} className="banner-btn">
              Đặt vật tư ngay
            </button>
          ) : (
            <button
              onClick={handleProfileAction}
              className={isWaitingAdmin ? "banner-btn-secondary" : "banner-btn"}
              disabled={isWaitingAdmin}
              style={
                isWaitingAdmin
                  ? { opacity: 0.75, cursor: "not-allowed" }
                  : undefined
              }
            >
              {getProfileButtonText()}
            </button>
          )}
        </div>
      </div>

      <div className="ponds-grid">
        <aside className="aside-list">
          <h2>Danh sách ao nuôi ({ponds.length})</h2>

          <button onClick={handleOpenCreate} className="btn-create-pond">
            + Thêm ao nuôi mới
          </button>

          <div className="cards-scroll">
            {ponds.map((item) => (
              <PondCard
                key={item.id_ao}
                pond={item}
                isActive={selectedPond?.id_ao === item.id_ao}
                hasActiveCrop={item.co_vu_dang_nuoi === true}
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
                  alt="Ao"
                />

                <div className="action-buttons">
                  <button
                    onClick={() => handleOpenEdit(selectedPond)}
                    className="btn-edit"
                  >
                    <i className="fa-regular fa-pen-to-square"></i> Sửa ao
                  </button>

                  {activeCrop ? (
                    <button
                      onClick={() => handleCloseCrop(activeCrop.id_vu_nuoi)}
                      className="btn-close-season"
                    >
                      <i className="fa-solid fa-circle-stop"></i> Kết thúc vụ
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsCropModalOpen(true)}
                      className="btn-new-season"
                    >
                      <i className="fa-solid fa-seedling"></i> Thả giống vụ mới
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(selectedPond.id_ao)}
                    className="btn-delete"
                  >
                    <i className="fa-regular fa-trash-can"></i> Xóa ao
                  </button>
                </div>

                <div className="detail-banner-content">
                  <h1>{selectedPond.ten_ao}</h1>
                  <p>
                    {selectedPond.dia_chi_ao || "Chưa cập nhật địa chỉ"} | Loài
                    nuôi: {selectedPond.loai_hinh_nuoi || "Chưa rõ"}
                  </p>
                </div>
              </div>

              <div className="specs-grid">
                <div className="spec-box">
                  <span>Diện tích</span>
                  <strong>{Number(selectedPond.dien_tich).toLocaleString()} m²</strong>
                </div>

                <div className="spec-box">
                  <span>Vụ nuôi</span>
                  <strong
                    style={{
                      fontSize: "14px",
                      color: activeCrop ? "#1e3a8a" : "#ef4444",
                    }}
                  >
                    {activeCrop ? activeCrop.ten_vu_nuoi : "AO TRỐNG"}
                  </strong>
                </div>

                <div className="spec-box">
                  <span>Giống thả</span>
                  <strong>
                    {activeCrop?.so_luong_giong
                      ? `${Number(activeCrop.so_luong_giong).toLocaleString()} con`
                      : "0 con"}
                  </strong>
                </div>

                <div className="spec-box">
                  <span>Mật độ nuôi</span>
                  <strong>
                    {activeCrop?.so_luong_giong
                      ? `${Math.round(
                        Number(activeCrop.so_luong_giong) /
                        Number(selectedPond.dien_tich)
                      )} con/m²`
                      : "0 con/m²"}
                  </strong>
                </div>

                <div className="spec-box">
                  <span>Ngày thu dự kiến</span>
                  <strong style={{ fontSize: "13px" }}>
                    {activeCrop?.ngay_thu_hoach_du_kien || "--/--/----"}
                  </strong>
                </div>
              </div>

              <div className="crop-seasons-section">
                <h3 className="section-title">
                  <i className="fa-solid fa-history"></i> Lịch sử các vụ nuôi của ao
                </h3>

                {cropSeasons.length === 0 ? (
                  <p className="no-data-text">Ao nuôi chưa từng có vụ nuôi nào.</p>
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
                            <td style={{ fontWeight: "700" }}>{crop.ten_vu_nuoi}</td>
                            <td>{crop.ngay_tha_giong || "Chưa cập nhật"}</td>
                            <td>
                              {crop.so_luong_giong
                                ? `${Number(crop.so_luong_giong).toLocaleString()} con`
                                : "--"}
                            </td>
                            <td>
                              <span
                                className={`table-badge ${crop.trang_thai === "dang_nuoi"
                                    ? "badge-green"
                                    : crop.trang_thai === "da_thu_hoach"
                                      ? "badge-blue"
                                      : "badge-red"
                                  }`}
                              >
                                {crop.trang_thai === "dang_nuoi"
                                  ? "ĐANG NUÔI"
                                  : crop.trang_thai === "da_thu_hoach"
                                    ? "ĐÃ THU HOẠCH"
                                    : "ĐÃ HỦY"}
                              </span>
                            </td>
                            <td>{crop.ghi_chu || "-"}</td>
                            <td>
                              <button
                                type="button"
                                className="btn-season-orders"
                                onClick={() =>
                                  navigate(`/ponds/crop-seasons/${crop.id_vu_nuoi}/orders`)
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
            <div className="ponds-no-selected">Vui lòng chọn ao nuôi.</div>
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

      {activeCrop && (
        <DebtRegistrationModal
          isOpen={isProfileModalOpen}
          pondName={selectedPond?.ten_ao || ""}
          cropName={activeCrop.ten_vu_nuoi}
          note={profileNote}
          onNoteChange={setProfileNote}
          onSubmit={handleCreateProfile}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
      {errorModal.open && (
        <div className="center-error-overlay">
          <div className="center-error-modal">
            <button className="center-error-close" onClick={closeErrorModal}>
              ×
            </button>

            <div className="center-error-icon">×</div>

            <h2>{errorModal.title}</h2>

            <p>{errorModal.message}</p>

            <button className="center-error-btn" onClick={closeErrorModal}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PondsPage;