import { useState } from "react";
import { createPortal } from "react-dom";
import { authService } from "../../services/auth.service";
import "./StaffLimitLayout.css";

type StaffLimitAccountCardProps = {
  userName: string;
  userInitial: string;
  userEmail?: string;
  userPhone?: string;
};

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

export default function StaffLimitAccountCard({
  userName,
  userInitial,
  userEmail,
  userPhone,
}: StaffLimitAccountCardProps) {
  const displayName = userName || "Nhan vien dinh muc";
  const displayInitial = (userInitial || displayName.trim().charAt(0) || "D").toUpperCase();
  const displayContact = userPhone || userEmail || "Dang dang nhap";
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
      <button type="button" className="staff-limit-user" onClick={() => setOpen(true)}>
        <div className="staff-limit-user__avatar">{displayInitial}</div>
        <div>
          <span>{displayName}</span>
          <strong>Nhan vien dinh muc</strong>
        </div>
      </button>

      {open &&
        createPortal(
        <div className="staff-limit-account-modal__overlay">
          <div className="staff-limit-account-modal">
            <div className="staff-limit-account-modal__header">
              <div className="staff-limit-account-modal__identity">
                <div className="staff-limit-account-modal__identity-mark">{displayInitial}</div>
                <div className="staff-limit-account-modal__identity-meta">
                  <span>Tai khoan nhan vien</span>
                  <h3>{displayName}</h3>
                  <p>Quan ly thong tin ca nhan va cap nhat bao mat dang nhap.</p>
                  <div className="staff-limit-account-modal__chips">
                    <span className="staff-limit-account-modal__chip staff-limit-account-modal__chip--role">
                      Nhan vien dinh muc
                    </span>
                    <span className="staff-limit-account-modal__chip">{displayContact}</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                x
              </button>
            </div>

            <section className="staff-limit-account-modal__section">
              <div className="staff-limit-account-modal__section-head">
                <h4>Thong tin ca nhan</h4>
                <span>Thong tin dang duoc su dung cho tai khoan hien tai</span>
              </div>

              <div className="staff-limit-account-modal__grid">
                <div>
                  <label>Ho ten</label>
                  <strong>{displayName || "Chua cap nhat"}</strong>
                </div>
                <div>
                  <label>So dien thoai</label>
                  <strong>{userPhone || "Chua cap nhat"}</strong>
                </div>
                <div className="staff-limit-account-modal__full">
                  <label>Email</label>
                  <strong>{userEmail || "Chua cap nhat"}</strong>
                </div>
              </div>
            </section>

            <section className="staff-limit-account-modal__section staff-limit-account-modal__section--security">
              <div className="staff-limit-account-modal__section-head">
                <h4>Doi mat khau</h4>
                <span>Tao mat khau moi de tang do an toan cho tai khoan</span>
              </div>

              {message && <div className="staff-limit-account-modal__success">{message}</div>}
              {error && <div className="staff-limit-account-modal__error">{error}</div>}

              <div className="staff-limit-account-modal__form">
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

            <div className="staff-limit-account-modal__actions">
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
