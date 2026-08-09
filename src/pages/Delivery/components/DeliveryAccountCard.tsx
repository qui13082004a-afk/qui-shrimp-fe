import { useState } from "react";
import { createPortal } from "react-dom";
import { authService } from "../../../services/auth.service";
import type { DeliveryUserInfo } from "./DeliveryHeader";
import "./DeliveryAccountCard.css";

interface DeliveryAccountCardProps {
  user: DeliveryUserInfo;
  variant?: "hero" | "shell";
}

const defaultPasswordForm = {
  mat_khau_cu: "",
  mat_khau_moi: "",
  xac_nhan_mat_khau_moi: "",
};

const handleLogout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export default function DeliveryAccountCard({
  user,
  variant = "hero",
}: DeliveryAccountCardProps) {
  const displayName = user.ho_ten || "Nhan vien giao hang";
  const displayContact = user.so_dien_thoai || user.email || "Dang dang nhap";
  const displayInitial = displayName.trim().charAt(0).toUpperCase() || "G";
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordForm, setPasswordForm] = useState(defaultPasswordForm);

  const handleChangePassword = async () => {
    if (
      !passwordForm.mat_khau_cu.trim() ||
      !passwordForm.mat_khau_moi.trim() ||
      !passwordForm.xac_nhan_mat_khau_moi.trim()
    ) {
      setError("Vui long nhap day du thong tin mat khau.");
      setMessage("");
      return;
    }

    if (passwordForm.mat_khau_moi !== passwordForm.xac_nhan_mat_khau_moi) {
      setError("Mat khau moi va xac nhan mat khau chua khop.");
      setMessage("");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      await authService.changePassword(passwordForm);
      setMessage("Doi mat khau thanh cong.");
      setPasswordForm(defaultPasswordForm);
    } catch (apiError: any) {
      setError(apiError?.response?.data?.message || "Khong the doi mat khau.");
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={
          variant === "shell"
            ? "delivery-shell-user__card"
            : "delivery-user-card delivery-user-card--button"
        }
        onClick={() => setOpen(true)}
      >
        <strong>{displayName}</strong>
        <span>{displayContact}</span>
      </button>

      {open &&
        createPortal(
        <div className="delivery-account-modal__overlay">
          <div className="delivery-account-modal">
            <div className="delivery-account-modal__header">
              <div className="delivery-account-modal__identity">
                <div className="delivery-account-modal__identity-mark">{displayInitial}</div>
                <div className="delivery-account-modal__identity-meta">
                  <span>Tai khoan nhan vien</span>
                  <h3>{displayName}</h3>
                  <p>Quan ly thong tin ca nhan va cap nhat bao mat dang nhap.</p>
                  <div className="delivery-account-modal__chips">
                    <span className="delivery-account-modal__chip delivery-account-modal__chip--role">
                      Nhan vien giao hang
                    </span>
                    <span className="delivery-account-modal__chip">{displayContact}</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                x
              </button>
            </div>

            <section className="delivery-account-modal__section">
              <div className="delivery-account-modal__section-head">
                <h4>Thong tin ca nhan</h4>
                <span>Thong tin dang duoc su dung cho tai khoan hien tai</span>
              </div>

              <div className="delivery-account-modal__grid">
                <div>
                  <label>Ho ten</label>
                  <strong>{user.ho_ten || "Chua cap nhat"}</strong>
                </div>
                <div>
                  <label>So dien thoai</label>
                  <strong>{user.so_dien_thoai || "Chua cap nhat"}</strong>
                </div>
                <div className="delivery-account-modal__full">
                  <label>Email</label>
                  <strong>{user.email || "Chua cap nhat"}</strong>
                </div>
              </div>
            </section>

            <section className="delivery-account-modal__section delivery-account-modal__section--security">
              <div className="delivery-account-modal__section-head">
                <h4>Doi mat khau</h4>
                <span>Tao mat khau moi de tang do an toan cho tai khoan</span>
              </div>

              {message && <div className="delivery-account-modal__success">{message}</div>}
              {error && <div className="delivery-account-modal__error">{error}</div>}

              <div className="delivery-account-modal__form">
                <label>
                  Mat khau hien tai
                  <input
                    type="password"
                    value={passwordForm.mat_khau_cu}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        mat_khau_cu: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Mat khau moi
                  <input
                    type="password"
                    value={passwordForm.mat_khau_moi}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        mat_khau_moi: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Xac nhan mat khau moi
                  <input
                    type="password"
                    value={passwordForm.xac_nhan_mat_khau_moi}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        xac_nhan_mat_khau_moi: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </section>

            <div className="delivery-account-modal__actions">
              <button type="button" className="danger" onClick={handleLogout}>
                Dang xuat
              </button>
              <button type="button" className="secondary" onClick={() => setOpen(false)}>
                Dong
              </button>
              <button
                type="button"
                className="primary"
                onClick={handleChangePassword}
                disabled={submitting}
              >
                {submitting ? "Dang luu..." : "Doi mat khau"}
              </button>
            </div>
          </div>
        </div>
        , document.body)}
    </>
  );
}
