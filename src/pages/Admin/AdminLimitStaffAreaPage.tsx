import { useEffect, useMemo, useState } from "react";
import { adminUserService, type AdminUser } from "../../services/adminUser.service";
import {
  limitStaffAreaService,
  type LimitStaffAreaAssignment,
  type LimitStaffAreaStatus,
} from "../../services/limitStaffArea.service";
import {
  customerProfileService,
  type SupportedPostpaidArea,
} from "../../services/customerProfile.service";
import "./AdminLimitStaffAreaPage.css";

type FormState = {
  id_nguoi_dung: string;
  id_khu_vuc: string;
  trang_thai: LimitStaffAreaStatus;
  ghi_chu: string;
};

const emptyForm: FormState = {
  id_nguoi_dung: "",
  id_khu_vuc: "",
  trang_thai: "dang_phu_trach",
  ghi_chu: "",
};

const statusLabels: Record<LimitStaffAreaStatus, string> = {
  dang_phu_trach: "Đang phụ trách",
  ngung_phu_trach: "Ngưng phụ trách",
};

const normalizeText = (value?: string | null) =>
  String(value || "").trim().toLowerCase();

const getAreaName = (area?: SupportedPostpaidArea | null) => {
  if (!area) return "Chưa có khu vực";
  return [area.phuong_xa, area.tinh_thanh].filter(Boolean).join(" - ");
};

export default function AdminLimitStaffAreaPage() {
  const [assignments, setAssignments] = useState<LimitStaffAreaAssignment[]>([]);
  const [staffs, setStaffs] = useState<AdminUser[]>([]);
  const [areas, setAreas] = useState<SupportedPostpaidArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<LimitStaffAreaStatus | "tat_ca">("tat_ca");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LimitStaffAreaAssignment | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      setAlert("");
      const [assignmentData, staffData, areaData] = await Promise.all([
        limitStaffAreaService.getAssignments(),
        adminUserService.getAllUsers({
          vai_tro: "nhan_vien_dinh_muc",
          trang_thai_tai_khoan: "hoat_dong",
          limit: 200,
        }),
        customerProfileService.getSupportedAreas(),
      ]);

      setAssignments(assignmentData || []);
      setStaffs(staffData?.items || []);
      setAreas(areaData?.data || []);
    } catch (error: any) {
      setAlert(
        error?.response?.data?.message ||
          "Không thể tải dữ liệu phân vùng nhân viên định mức"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAssignments = useMemo(() => {
    const keyword = normalizeText(search);

    return assignments.filter((item) => {
      const staffName = normalizeText(item.NguoiDung?.ho_ten);
      const staffPhone = normalizeText(item.NguoiDung?.so_dien_thoai);
      const staffEmail = normalizeText(item.NguoiDung?.email);
      const province = normalizeText(item.KhuVucHoTroTraSau?.tinh_thanh);
      const ward = normalizeText(item.KhuVucHoTroTraSau?.phuong_xa);
      const note = normalizeText(item.ghi_chu);

      const matchSearch =
        !keyword ||
        staffName.includes(keyword) ||
        staffPhone.includes(keyword) ||
        staffEmail.includes(keyword) ||
        province.includes(keyword) ||
        ward.includes(keyword) ||
        note.includes(keyword);

      const matchStatus =
        statusFilter === "tat_ca" || item.trang_thai === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [assignments, search, statusFilter]);

  const stats = useMemo(() => {
    const activeStaffIds = new Set(
      assignments
        .filter((item) => item.trang_thai === "dang_phu_trach")
        .map((item) => item.id_nguoi_dung)
    );

    return {
      total: assignments.length,
      active: assignments.filter((item) => item.trang_thai === "dang_phu_trach")
        .length,
      inactive: assignments.filter((item) => item.trang_thai === "ngung_phu_trach")
        .length,
      activeStaff: activeStaffIds.size,
    };
  }, [assignments]);

  const openCreateModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (assignment: LimitStaffAreaAssignment) => {
    setEditing(assignment);
    setForm({
      id_nguoi_dung: String(assignment.id_nguoi_dung || ""),
      id_khu_vuc: String(assignment.id_khu_vuc || ""),
      trang_thai: assignment.trang_thai,
      ghi_chu: assignment.ghi_chu || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    if (!editing && (!form.id_nguoi_dung || !form.id_khu_vuc)) {
      setAlert("Vui lòng chọn nhân viên định mức và khu vực phụ trách");
      return;
    }

    try {
      setSaving(true);
      setAlert("");

      if (editing) {
        await limitStaffAreaService.updateAssignment(editing.id_phan_cong, {
          trang_thai: form.trang_thai,
          ghi_chu: form.ghi_chu,
        });
        setAlert("Đã cập nhật phân vùng nhân viên định mức");
      } else {
        await limitStaffAreaService.assignStaffToArea({
          id_nguoi_dung: form.id_nguoi_dung,
          id_khu_vuc: form.id_khu_vuc,
          trang_thai: form.trang_thai,
          ghi_chu: form.ghi_chu,
        });
        setAlert("Đã phân công khu vực cho nhân viên định mức");
      }

      closeModal();
      fetchData();
    } catch (error: any) {
      setAlert(
        error?.response?.data?.message ||
          "Không thể lưu phân vùng nhân viên định mức"
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (assignment: LimitStaffAreaAssignment) => {
    const nextStatus: LimitStaffAreaStatus =
      assignment.trang_thai === "dang_phu_trach"
        ? "ngung_phu_trach"
        : "dang_phu_trach";

    try {
      setAlert("");
      await limitStaffAreaService.updateAssignment(assignment.id_phan_cong, {
        trang_thai: nextStatus,
        ghi_chu: assignment.ghi_chu || "",
      });
      fetchData();
    } catch (error: any) {
      setAlert(
        error?.response?.data?.message || "Không thể đổi trạng thái phân vùng"
      );
    }
  };

  return (
    <div className="admin-limit-staff">
      <section className="admin-limit-staff__hero">
        <div>
          <span>QUẢN LÝ NGƯỜI DÙNG</span>
          <h1>Phân vùng nhân viên định mức</h1>
          <p>
            Chỉ nhân viên được phân vùng phù hợp mới nhận thông báo hồ sơ trả sau
            trong khu vực mình phụ trách.
          </p>
        </div>
        <button type="button" onClick={openCreateModal}>
          + Phân công khu vực
        </button>
      </section>

      {alert && (
        <div className="admin-limit-staff__alert">
          <span>{alert}</span>
          <button type="button" onClick={() => setAlert("")}>
            x
          </button>
        </div>
      )}

      <section className="admin-limit-staff__stats">
        <div>
          <span>Tổng phân vùng</span>
          <strong>{stats.total}</strong>
          <p>Khu vực đã gán cho nhân viên</p>
        </div>
        <div>
          <span>Đang phụ trách</span>
          <strong>{stats.active}</strong>
          <p>Phân vùng đang nhận hồ sơ</p>
        </div>
        <div>
          <span>Tạm ngưng</span>
          <strong>{stats.inactive}</strong>
          <p>Không nhận thông báo mới</p>
        </div>
        <div>
          <span>Nhân viên hoạt động</span>
          <strong>{stats.activeStaff}</strong>
          <p>Đang có khu vực phụ trách</p>
        </div>
      </section>

      <section className="admin-limit-staff__card">
        <div className="admin-limit-staff__card-head">
          <div>
            <h2>Danh sách phân vùng</h2>
            <p>Tìm kiếm, bật/tắt và cập nhật ghi chú phụ trách khu vực.</p>
          </div>
          <button type="button" onClick={fetchData} disabled={loading}>
            Làm mới
          </button>
        </div>

        <div className="admin-limit-staff__toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo nhân viên, SĐT, email, tỉnh hoặc xã..."
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as LimitStaffAreaStatus | "tat_ca")
            }
          >
            <option value="tat_ca">Tất cả trạng thái</option>
            <option value="dang_phu_trach">Đang phụ trách</option>
            <option value="ngung_phu_trach">Ngưng phụ trách</option>
          </select>
        </div>

        <div className="admin-limit-staff__table-wrap">
          <table className="admin-limit-staff__table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Khu vực phụ trách</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={5}>
                      <div className="admin-limit-staff__skeleton" />
                    </td>
                  </tr>
                ))
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-limit-staff__empty">
                      Chưa có phân vùng nhân viên định mức phù hợp
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((assignment) => (
                  <tr key={assignment.id_phan_cong}>
                    <td>
                      <strong>{assignment.NguoiDung?.ho_ten || "Nhân viên"}</strong>
                      <span>
                        {assignment.NguoiDung?.so_dien_thoai ||
                          assignment.NguoiDung?.email ||
                          `#${assignment.id_nguoi_dung}`}
                      </span>
                    </td>
                    <td>
                      <strong>{getAreaName(assignment.KhuVucHoTroTraSau)}</strong>
                      <span>
                        Mã khu vực #{assignment.id_khu_vuc}
                        {assignment.KhuVucHoTroTraSau?.trang_thai
                          ? ` · ${assignment.KhuVucHoTroTraSau.trang_thai}`
                          : ""}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-limit-staff__badge admin-limit-staff__badge--${assignment.trang_thai}`}
                      >
                        {statusLabels[assignment.trang_thai]}
                      </span>
                    </td>
                    <td>{assignment.ghi_chu || "Không có ghi chú"}</td>
                    <td>
                      <div className="admin-limit-staff__actions">
                        <button type="button" onClick={() => openEditModal(assignment)}>
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(assignment)}
                        >
                          {assignment.trang_thai === "dang_phu_trach"
                            ? "Tạm ngưng"
                            : "Kích hoạt"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div className="admin-limit-staff__modal-overlay">
          <div className="admin-limit-staff__modal">
            <div className="admin-limit-staff__modal-head">
              <div>
                <h2>{editing ? "Cập nhật phân vùng" : "Phân công khu vực"}</h2>
                <p>
                  {editing
                    ? "Cập nhật trạng thái và ghi chú của phân vùng hiện tại."
                    : "Chọn nhân viên định mức và khu vực trả sau cần phụ trách."}
                </p>
              </div>
              <button type="button" onClick={closeModal}>
                x
              </button>
            </div>

            <div className="admin-limit-staff__form">
              <label>
                Nhân viên định mức
                <select
                  value={form.id_nguoi_dung}
                  disabled={Boolean(editing)}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      id_nguoi_dung: event.target.value,
                    }))
                  }
                >
                  <option value="">Chọn nhân viên</option>
                  {staffs.map((staff) => (
                    <option key={staff.id_nguoi_dung} value={staff.id_nguoi_dung}>
                      {staff.ho_ten} - {staff.so_dien_thoai || staff.email}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Khu vực phụ trách
                <select
                  value={form.id_khu_vuc}
                  disabled={Boolean(editing)}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      id_khu_vuc: event.target.value,
                    }))
                  }
                >
                  <option value="">Chọn khu vực</option>
                  {areas.map((area) => (
                    <option key={area.id_khu_vuc} value={area.id_khu_vuc}>
                      {getAreaName(area)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Trạng thái
                <select
                  value={form.trang_thai}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      trang_thai: event.target.value as LimitStaffAreaStatus,
                    }))
                  }
                >
                  <option value="dang_phu_trach">Đang phụ trách</option>
                  <option value="ngung_phu_trach">Ngưng phụ trách</option>
                </select>
              </label>

              <label className="admin-limit-staff__form-full">
                Ghi chú
                <textarea
                  value={form.ghi_chu}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      ghi_chu: event.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Phụ trách hồ sơ trả sau khu vực Cà Mau..."
                />
              </label>
            </div>

            <div className="admin-limit-staff__modal-footer">
              <button type="button" onClick={closeModal}>
                Hủy
              </button>
              <button type="button" onClick={handleSubmit} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
