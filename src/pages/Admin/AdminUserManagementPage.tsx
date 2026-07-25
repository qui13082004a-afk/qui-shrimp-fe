import { useEffect, useMemo, useState } from "react";
import { adminUserService } from "../../services/adminUser.service";
import type {
  AdminUser,
  UserRole,
  UserStatus,
} from "../../services/adminUser.service";
import "./AdminUserManagementPage.css";

type CreateStaffForm = {
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  mat_khau: string;
  vai_tro: "nhan_vien_giao_hang" | "nhan_vien_dinh_muc";
};

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  khach_hang: "Khách hàng",
  nhan_vien_giao_hang: "Nhân viên giao hàng",
  nhan_vien_dinh_muc: "Nhân viên định mức",
};

const statusLabels: Record<UserStatus, string> = {
  chua_xac_thuc: "Chưa xác thực",
  hoat_dong: "Hoạt động",
  khoa: "Đã khóa",
};

const defaultCreateForm: CreateStaffForm = {
  ho_ten: "",
  email: "",
  so_dien_thoai: "",
  mat_khau: "",
  vai_tro: "nhan_vien_giao_hang",
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
};

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "tat_ca">("tat_ca");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "tat_ca">(
    "tat_ca"
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("khach_hang");
  const [statusModalUser, setStatusModalUser] = useState<AdminUser | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [createForm, setCreateForm] = useState<CreateStaffForm>(defaultCreateForm);

  const stats = useMemo(
    () => ({
      total: totalUsers,
      admin: users.filter((item) => item.vai_tro === "admin").length,
      limitStaff: users.filter((item) => item.vai_tro === "nhan_vien_dinh_muc")
        .length,
      locked: users.filter((item) => item.trang_thai_tai_khoan === "khoa")
        .length,
    }),
    [users, totalUsers]
  );

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUserService.getAllUsers({
        search,
        vai_tro: roleFilter,
        trang_thai_tai_khoan: statusFilter,
        page,
        limit: 10,
      });
      setUsers(data.items || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalUsers(data.pagination?.total || 0);
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể tải người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const openRoleModal = (user: AdminUser) => {
    setRoleModalUser(user);
    setNewRole(user.vai_tro);
  };

  const handleUpdateRole = async () => {
    if (!roleModalUser) return;
    try {
      await adminUserService.updateUserRole(roleModalUser.id_nguoi_dung, newRole);
      setAlert("Cập nhật vai trò thành công");
      setRoleModalUser(null);
      fetchUsers();
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể cập nhật vai trò");
    }
  };

  const handleToggleStatus = async () => {
    if (!statusModalUser) return;

    const nextStatus: UserStatus =
      statusModalUser.trang_thai_tai_khoan === "khoa" ? "hoat_dong" : "khoa";

    try {
      await adminUserService.updateUserStatus(
        statusModalUser.id_nguoi_dung,
        nextStatus
      );
      setAlert(
        nextStatus === "khoa"
          ? "Đã khóa tài khoản người dùng"
          : "Đã mở khóa tài khoản người dùng"
      );
      setStatusModalUser(null);
      fetchUsers();
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể cập nhật trạng thái");
    }
  };

  const openCreateModal = () => {
    setCreateForm(defaultCreateForm);
    setShowCreateModal(true);
  };

  const handleCreateStaff = async () => {
    if (
      !createForm.ho_ten.trim() ||
      !createForm.email.trim() ||
      !createForm.mat_khau.trim()
    ) {
      setAlert("Vui lòng nhập đầy đủ thông tin tài khoản nhân viên");
      return;
    }

    try {
      setCreatingStaff(true);
      await adminUserService.createStaffUser({
        ho_ten: createForm.ho_ten.trim(),
        email: createForm.email.trim(),
        so_dien_thoai: createForm.so_dien_thoai.trim(),
        mat_khau: createForm.mat_khau,
        vai_tro: createForm.vai_tro,
      });
      setAlert("Tạo tài khoản nhân viên thành công");
      setShowCreateModal(false);
      setCreateForm(defaultCreateForm);
      fetchUsers();
    } catch (error: any) {
      setAlert(
        error?.response?.data?.message || "Không thể tạo tài khoản nhân viên"
      );
    } finally {
      setCreatingStaff(false);
    }
  };

  return (
    <div className="admin-page admin-user-page">
      <div className="admin-page__header admin-page__header--between">
        <div>
          <p className="admin-page__eyebrow">Quản lý hệ thống</p>
          <h1>Quản lý người dùng</h1>
          <p>Theo dõi tài khoản, phân quyền nhân viên và khóa/mở tài khoản.</p>
        </div>
      </div>

      {alert && (
        <div className="admin-alert admin-user-alert">
          <span>{alert}</span>
          <button type="button" onClick={() => setAlert("")}>
            ×
          </button>
        </div>
      )}

      <div className="admin-user-stats">
        <div className="admin-user-stat-card">
          <span>Tổng người dùng</span>
          <strong>{stats.total}</strong>
          <p>Tất cả tài khoản trong hệ thống</p>
        </div>
        <div className="admin-user-stat-card">
          <span>Admin</span>
          <strong>{stats.admin}</strong>
          <p>Trên trang hiện tại</p>
        </div>
        <div className="admin-user-stat-card">
          <span>Nhân viên định mức</span>
          <strong>{stats.limitStaff}</strong>
          <p>Phụ trách hồ sơ và hạn mức</p>
        </div>
        <div className="admin-user-stat-card">
          <span>Tài khoản khóa</span>
          <strong>{stats.locked}</strong>
          <p>Trên trang hiện tại</p>
        </div>
      </div>

      <div className="admin-card admin-user-card">
        <div className="admin-user-card__top">
          <div className="admin-user-card__topbar">
            <div>
              <h2>Danh sách người dùng</h2>
              <p>Tìm kiếm, lọc vai trò và cập nhật phân quyền.</p>
            </div>
            <button
              type="button"
              className="admin-primary-btn"
              onClick={openCreateModal}
            >
              + Tạo tài khoản nhân viên
            </button>
          </div>
        </div>

        <div className="admin-toolbar admin-user-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tên, email, SĐT..."
          />

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as UserRole | "tat_ca")}
          >
            <option value="tat_ca">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="khach_hang">Khách hàng</option>
            <option value="nhan_vien_giao_hang">Nhân viên giao hàng</option>
            <option value="nhan_vien_dinh_muc">Nhân viên định mức</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as UserStatus | "tat_ca")
            }
          >
            <option value="tat_ca">Tất cả trạng thái</option>
            <option value="hoat_dong">Hoạt động</option>
            <option value="khoa">Đã khóa</option>
            <option value="chua_xac_thuc">Chưa xác thực</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Người dùng</th>
                <th>Liên hệ</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-user-empty">Đang tải dữ liệu...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-user-empty">Không có người dùng phù hợp</div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id_nguoi_dung}>
                    <td>
                      <strong>#{user.id_nguoi_dung}</strong>
                    </td>
                    <td>
                      <strong>{user.ho_ten}</strong>
                      <span>{user.email}</span>
                    </td>
                    <td>
                      <strong>{user.so_dien_thoai || "Chưa có SĐT"}</strong>
                      <span>{user.tinh_thanh || "Chưa cập nhật tỉnh/thành"}</span>
                    </td>
                    <td>
                      <span className={`admin-badge role-${user.vai_tro}`}>
                        {roleLabels[user.vai_tro]}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge status-${user.trang_thai_tai_khoan}`}>
                        {statusLabels[user.trang_thai_tai_khoan]}
                      </span>
                    </td>
                    <td>{formatDate(user.ngay_tao)}</td>
                    <td>
                      <div className="admin-user-actions">
                        <button type="button" onClick={() => setSelectedUser(user)}>
                          Chi tiết
                        </button>
                        <button type="button" onClick={() => openRoleModal(user)}>
                          Vai trò
                        </button>
                        <button
                          type="button"
                          className={
                            user.trang_thai_tai_khoan === "khoa" ? "" : "danger"
                          }
                          onClick={() => setStatusModalUser(user)}
                        >
                          {user.trang_thai_tai_khoan === "khoa" ? "Mở khóa" : "Khóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-user-pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Trước
          </button>
          <span>
            Trang {page}/{totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Sau
          </button>
        </div>
      </div>

      {selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-user-modal">
            <div className="admin-modal__header">
              <div>
                <h2>Chi tiết người dùng</h2>
                <p>{selectedUser.ho_ten}</p>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setSelectedUser(null)}
              >
                ×
              </button>
            </div>

            <div className="admin-user-detail-grid">
              <div>
                <span>ID</span>
                <strong>#{selectedUser.id_nguoi_dung}</strong>
              </div>
              <div>
                <span>Vai trò</span>
                <strong>{roleLabels[selectedUser.vai_tro]}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{selectedUser.email}</strong>
              </div>
              <div>
                <span>Số điện thoại</span>
                <strong>{selectedUser.so_dien_thoai || "Chưa cập nhật"}</strong>
              </div>
              <div className="admin-user-detail-grid__full">
                <span>Địa chỉ</span>
                <strong>{selectedUser.dia_chi || "Chưa cập nhật"}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {roleModalUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-user-confirm">
            <div className="admin-modal__header">
              <div>
                <h2>Cập nhật vai trò</h2>
                <p>{roleModalUser.ho_ten}</p>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setRoleModalUser(null)}
              >
                ×
              </button>
            </div>

            <label>
              Vai trò
              <select
                value={newRole}
                onChange={(event) => setNewRole(event.target.value as UserRole)}
              >
                <option value="admin">Admin</option>
                <option value="khach_hang">Khách hàng</option>
                <option value="nhan_vien_giao_hang">Nhân viên giao hàng</option>
                <option value="nhan_vien_dinh_muc">Nhân viên định mức</option>
              </select>
            </label>

            <div className="admin-modal__actions">
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={() => setRoleModalUser(null)}
              >
                Hủy
              </button>
              <button type="button" className="admin-primary-btn" onClick={handleUpdateRole}>
                Lưu vai trò
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModalUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-user-confirm">
            <div className="admin-modal__header">
              <div>
                <h2>
                  {statusModalUser.trang_thai_tai_khoan === "khoa"
                    ? "Mở khóa tài khoản"
                    : "Khóa tài khoản"}
                </h2>
                <p>{statusModalUser.ho_ten}</p>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setStatusModalUser(null)}
              >
                ×
              </button>
            </div>

            <p>
              {statusModalUser.trang_thai_tai_khoan === "khoa"
                ? "Xác nhận mở khóa tài khoản này?"
                : "Xác nhận khóa tài khoản này?"}
            </p>

            <div className="admin-modal__actions">
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={() => setStatusModalUser(null)}
              >
                Hủy
              </button>
              <button type="button" className="admin-primary-btn" onClick={handleToggleStatus}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-user-create-modal">
            <div className="admin-modal__header">
              <div>
                <h2>Tạo tài khoản nhân viên</h2>
                <p>Tạo mới nhân viên giao hàng hoặc nhân viên định mức.</p>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-user-create-grid">
              <label>
                Họ tên
                <input
                  value={createForm.ho_ten}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, ho_ten: event.target.value }))
                  }
                />
              </label>

              <label>
                Email
                <input
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </label>

              <label>
                Số điện thoại
                <input
                  value={createForm.so_dien_thoai}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      so_dien_thoai: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Mật khẩu
                <input
                  type="password"
                  value={createForm.mat_khau}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      mat_khau: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="admin-user-create-grid__full">
                Vai trò
                <select
                  value={createForm.vai_tro}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      vai_tro: event.target.value as CreateStaffForm["vai_tro"],
                    }))
                  }
                >
                  <option value="nhan_vien_giao_hang">Nhân viên giao hàng</option>
                  <option value="nhan_vien_dinh_muc">Nhân viên định mức</option>
                </select>
              </label>
            </div>

            <div className="admin-modal__actions">
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={handleCreateStaff}
                disabled={creatingStaff}
              >
                {creatingStaff ? "Đang tạo..." : "Tạo tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
