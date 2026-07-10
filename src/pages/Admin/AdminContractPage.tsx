import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { pdf } from "@react-pdf/renderer";
import {
    contractService,
    type Contract,
    type CreateContractPayload,
} from "../../services/contract.service";
import {
    customerProfileService,
    type CustomerDebtProfile,
} from "../../services/customerProfile.service";
import ContractPdfDocument from "../Admin/contracts/ContractPdfDocument";
import "./AdminCommon.css";
import "./AdminContractPage.css";

const statusLabel: Record<string, string> = {
    cho_ky: "Chờ ký",
    cho_xac_nhan: "Chờ xác nhận",
    da_ky: "Đã ký",
    huy: "Đã hủy",
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

const formatFileSize = (size: number) => {
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const initialCreateForm: CreateContractPayload = {
    id_ho_so: 0,
    file_hop_dong_mau: "",
    ghi_chu: "",
};

export default function AdminContractPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [profiles, setProfiles] = useState<CustomerDebtProfile[]>([]);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(
        null
    );

    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState("");

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    const [createForm, setCreateForm] =
        useState<CreateContractPayload>(initialCreateForm);

    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [generatingPreview, setGeneratingPreview] = useState(false);
    const [extraTerms, setExtraTerms] = useState("");

    const [uploadPdfFile, setUploadPdfFile] = useState<File | null>(null);
    const [uploadImageFile, setUploadImageFile] = useState<File | null>(null);
    const [uploadForm, setUploadForm] = useState({
        ngay_ky: "",
        ghi_chu: "",
    });

    const [confirmNote, setConfirmNote] = useState("");
    const [cancelNote, setCancelNote] = useState("");
    const [restoreNote, setRestoreNote] = useState("");

    const fetchContracts = async () => {
        try {
            setLoading(true);
            const res = await contractService.getAllContracts();
            setContracts(res);
        } catch (error: any) {
            console.error("Lỗi tải danh sách hợp đồng:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfiles = async () => {
        try {
            setProfileLoading(true);
            const res = await customerProfileService.getAllCustomerProfiles();
            setProfiles(Array.isArray(res) ? res : res?.data || []);
        } catch (error) {
            console.error("Lỗi tải danh sách hồ sơ:", error);
            setProfiles([]);
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
        fetchProfiles();
    }, []);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const approvedProfilesWithoutContract = useMemo(() => {
        const usedProfileIds = new Set(
            contracts
                .filter((item) => item.trang_thai !== "huy")
                .map((item) => Number(item.id_ho_so))
                .filter(Boolean)
        );

        return profiles.filter(
            (profile) =>
                profile.id_ho_so &&
                profile.trang_thai_ho_so === "da_duyet" &&
                profile.duoc_phep_tra_sau &&
                !usedProfileIds.has(Number(profile.id_ho_so))
        );
    }, [profiles, contracts]);

    const selectedCreateProfile = useMemo(() => {
        return profiles.find(
            (profile) => Number(profile.id_ho_so) === Number(createForm.id_ho_so)
        );
    }, [profiles, createForm.id_ho_so]);

    const stats = useMemo(() => {
        return {
            total: contracts.length,
            waitingSign: contracts.filter((item) => item.trang_thai === "cho_ky")
                .length,
            waitingConfirm: contracts.filter(
                (item) => item.trang_thai === "cho_xac_nhan"
            ).length,
            signed: contracts.filter((item) => item.trang_thai === "da_ky").length,
            canceled: contracts.filter((item) => item.trang_thai === "huy").length,
        };
    }, [contracts]);

    const filteredContracts = useMemo(() => {
        return contracts.filter((item) => {
            const searchText = `${item.id_hop_dong || ""} ${item.id_ho_so || ""} ${item.HoSoKhachHang?.NguoiDung?.ho_ten || ""
                } ${item.HoSoKhachHang?.NguoiDung?.so_dien_thoai || ""} ${item.HoSoKhachHang?.AoNuoi?.ten_ao || ""
                } ${item.HoSoKhachHang?.VuNuoi?.ten_vu_nuoi || ""} ${item.ghi_chu || ""
                }`.toLowerCase();

            const matchKeyword = searchText.includes(keyword.toLowerCase().trim());
            const matchStatus =
                statusFilter === "all" || item.trang_thai === statusFilter;

            return matchKeyword && matchStatus;
        });
    }, [contracts, keyword, statusFilter]);

    const getCustomerName = (contract: Contract) => {
        return contract.HoSoKhachHang?.NguoiDung?.ho_ten || "Chưa có thông tin";
    };

    const getPhone = (contract: Contract) => {
        return contract.HoSoKhachHang?.NguoiDung?.so_dien_thoai || "Chưa có SĐT";
    };

    const clearPreview = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setPreviewFile(null);
        setPreviewUrl("");
    };

    const closeAllModal = () => {
        setSelectedContract(null);
        setShowCreateModal(false);
        setShowDetailModal(false);
        setShowUploadModal(false);
        setShowConfirmModal(false);
        setShowCancelModal(false);
        setShowRestoreModal(false);
        setCreateForm(initialCreateForm);
        setUploadPdfFile(null);
        setUploadImageFile(null);
        setUploadForm({
            ngay_ky: "",
            ghi_chu: "",
        });
        setConfirmNote("");
        setCancelNote("");
        setRestoreNote("");
        setExtraTerms("");
        clearPreview();
    };

    const openCreateModal = () => {
        setCreateForm(initialCreateForm);
        setExtraTerms("");
        clearPreview();
        setShowCreateModal(true);
    };

    const openDetail = (contract: Contract) => {
        setSelectedContract(contract);
        setShowDetailModal(true);
    };

    const openUploadModal = (contract: Contract) => {
        setSelectedContract(contract);
        setUploadPdfFile(null);
        setUploadImageFile(null);
        setUploadForm({
            ngay_ky: contract.ngay_ky ? contract.ngay_ky.slice(0, 10) : "",
            ghi_chu: contract.ghi_chu || "",
        });
        setShowUploadModal(true);
    };

    const openConfirmModal = (contract: Contract) => {
        setSelectedContract(contract);
        setConfirmNote(contract.ghi_chu || "");
        setShowConfirmModal(true);
    };

    const openCancelModal = (contract: Contract) => {
        setSelectedContract(contract);
        setCancelNote(contract.ghi_chu || "");
        setShowCancelModal(true);
    };

    const openRestoreModal = (contract: Contract) => {
        setSelectedContract(contract);
        setRestoreNote(contract.ghi_chu || "");
        setShowRestoreModal(true);
    };

    const handleChooseSignedPdf = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (file.type !== "application/pdf") {
            setMessage("Chỉ hỗ trợ file PDF hợp đồng đã ký");
            event.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setMessage("File PDF hợp đồng không được vượt quá 10MB");
            event.target.value = "";
            return;
        }

        setUploadPdfFile(file);
    };

    const handleChooseSignedImage = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

        if (!allowedTypes.includes(file.type)) {
            setMessage("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage("Ảnh hợp đồng không được vượt quá 5MB");
            event.target.value = "";
            return;
        }

        setUploadImageFile(file);
    };

    const createPdfFileFromProfile = async (
        profile: CustomerDebtProfile,
        terms?: string
    ) => {
        const contractCode = `HD-${String(profile.id_ho_so).padStart(
            5,
            "0"
        )}-${Date.now()}`;

        const blob = await pdf(
            <ContractPdfDocument
                profile={profile}
                contractCode={contractCode}
                extraTerms={terms?.trim() || undefined}
            />
        ).toBlob();

        const downloadUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `HopDong-${contractCode}.pdf`;
        a.style.display = "none";

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => {
            URL.revokeObjectURL(downloadUrl);
        }, 1000);

        return new File([blob], `HopDong-${contractCode}.pdf`, {
            type: "application/pdf",
        });
    };

    const handleGeneratePreview = async (showMissingProfileWarning = true) => {
        if (!selectedCreateProfile) {
            if (showMissingProfileWarning) {
                setMessage("Vui lòng chọn hồ sơ mua trả sau");
            } return null;
        }

        try {
            setGeneratingPreview(true);
            clearPreview();

            const file = await createPdfFileFromProfile(
                selectedCreateProfile,
                extraTerms
            );

            const url = URL.createObjectURL(file);

            setPreviewFile(file);
            setPreviewUrl(url);

            return file;
        } catch (error) {
            console.error("Lỗi tạo PDF:", error);
            setMessage("Không thể tạo file PDF hợp đồng");
            return null;
        } finally {
            setGeneratingPreview(false);
        }
    };

    const handleCreateContract = async (event: FormEvent) => {
        event.preventDefault();

        if (!createForm.id_ho_so) {
            setMessage("Vui lòng chọn hồ sơ mua trả sau");
            return;
        }

        try {
            setProcessing(true);

            let pdfFile = previewFile;

            if (!pdfFile) {
                pdfFile = await handleGeneratePreview(false);
            }

            let uploadedPdfUrl = "";

            if (pdfFile) {
                const uploadRes = await contractService.uploadContractFile(pdfFile);
                uploadedPdfUrl =
                    uploadRes?.data?.url ||
                    uploadRes?.data?.path ||
                    uploadRes?.url ||
                    uploadRes?.path ||
                    "";
            }

            await contractService.createContract({
                id_ho_so: Number(createForm.id_ho_so),
                file_hop_dong_mau: uploadedPdfUrl || null,
                ghi_chu: createForm.ghi_chu || null,
                dieu_khoan_bo_sung: extraTerms || null,
            });

            setMessage("Tạo hợp đồng thành công");
            closeAllModal();
            fetchContracts();
        } catch (error: any) {
            console.error("Lỗi tạo hợp đồng:", error);
            setMessage(error?.response?.data?.message || "Tạo hợp đồng thất bại");
        } finally {
            setProcessing(false);
        }
    };

    const handleUploadSignedFiles = async (event: FormEvent) => {
        event.preventDefault();

        if (!selectedContract?.id_hop_dong) {
            setMessage("Không tìm thấy hợp đồng");
            return;
        }

        if (!uploadPdfFile && !uploadImageFile) {
            setMessage("Vui lòng chọn PDF hoặc ảnh hợp đồng đã ký");
            return;
        }

        try {
            setProcessing(true);

            if (uploadPdfFile) {
                await contractService.uploadSignedPdf(
                    selectedContract.id_hop_dong,
                    uploadPdfFile,
                    {
                        ngay_ky: uploadForm.ngay_ky || null,
                        ghi_chu: uploadForm.ghi_chu || null,
                    }
                );
            }

            if (uploadImageFile) {
                await contractService.uploadSignedImage(
                    selectedContract.id_hop_dong,
                    uploadImageFile,
                    {
                        ngay_ky: uploadForm.ngay_ky || null,
                        ghi_chu: uploadForm.ghi_chu || null,
                    }
                );
            }

            setMessage("Upload hợp đồng đã ký thành công");
            closeAllModal();
            fetchContracts();
        } catch (error: any) {
            console.error("Lỗi upload hợp đồng:", error);
            setMessage(
                error?.response?.data?.message || "Upload hợp đồng đã ký thất bại"
            );
        } finally {
            setProcessing(false);
        }
    };

    const handleConfirmContract = async () => {
        if (!selectedContract?.id_hop_dong) return;

        try {
            setProcessing(true);

            await contractService.confirmContract(selectedContract.id_hop_dong, {
                ghi_chu: confirmNote || null,
            });

            setMessage("Xác nhận hợp đồng thành công");
            closeAllModal();
            fetchContracts();
        } catch (error: any) {
            console.error("Lỗi xác nhận hợp đồng:", error);
            setMessage(
                error?.response?.data?.message || "Xác nhận hợp đồng thất bại"
            );
        } finally {
            setProcessing(false);
        }
    };

    const handleCancelContract = async () => {
        if (!selectedContract?.id_hop_dong) return;

        try {
            setProcessing(true);

            await contractService.cancelContract(selectedContract.id_hop_dong, {
                ghi_chu: cancelNote || null,
            });

            setMessage("Hủy hợp đồng thành công");
            closeAllModal();
            fetchContracts();
        } catch (error: any) {
            console.error("Lỗi hủy hợp đồng:", error);
            setMessage(error?.response?.data?.message || "Hủy hợp đồng thất bại");
        } finally {
            setProcessing(false);
        }
    };

    const handleRestoreContract = async () => {
        if (!selectedContract?.id_hop_dong) return;

        try {
            setProcessing(true);

            await contractService.restoreContract(selectedContract.id_hop_dong, {
                ghi_chu: restoreNote || null,
            });

            setMessage("Khôi phục hợp đồng thành công");
            closeAllModal();
            fetchContracts();
        } catch (error: any) {
            console.error("Lỗi khôi phục hợp đồng:", error);
            setMessage(
                error?.response?.data?.message || "Khôi phục hợp đồng thất bại"
            );
        } finally {
            setProcessing(false);
        }
    };

    const renderStatusBadge = (status?: string) => {
        return (
            <span className={`contract-status contract-status--${status || "unknown"}`}>
                {statusLabel[status || ""] || "Không rõ"}
            </span>
        );
    };

    const renderFileButton = (
        label: string,
        url?: string | null,
        variant: "pdf" | "image" = "pdf"
    ) => {
        if (!url) {
            return (
                <span className="contract-file-empty">
                    {variant === "pdf" ? "Chưa có PDF" : "Chưa có ảnh"}
                </span>
            );
        }

        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className={`contract-file-link contract-file-link--${variant}`}
            >
                {label}
            </a>
        );
    };

    const renderSignedImagePreview = (url?: string | null) => {
        if (!url) {
            return (
                <div className="contract-image-empty">
                    <span>Chưa có ảnh hợp đồng đã ký</span>
                </div>
            );
        }

        return (
            <a href={url} target="_blank" rel="noreferrer" className="contract-image-preview">
                <img src={url} alt="Ảnh hợp đồng đã ký" />
            </a>
        );
    };

    return (
        <div className="admin-page admin-contract-page">
            <div className="admin-page__header">
                <div>
                    <p className="admin-page__eyebrow">Quản lý công nợ</p>
                    <h1>Quản lý hợp đồng</h1>
                    <p className="admin-page__subtitle">
                        Tạo hợp đồng mua trả sau, upload PDF/ảnh sau ký và xác nhận hiệu lực.
                    </p>
                </div>

                <button className="admin-primary-btn" onClick={openCreateModal}>
                    + Tạo hợp đồng
                </button>
            </div>

            {message && (
                <div className="admin-alert">
                    <span>{message}</span>
                    <button onClick={() => setMessage("")}>×</button>
                </div>
            )}

            <div className="contract-stats">
                <div className="contract-stat-card">
                    <span>Tổng hợp đồng</span>
                    <strong>{stats.total}</strong>
                </div>
                <div className="contract-stat-card">
                    <span>Chờ ký</span>
                    <strong>{stats.waitingSign}</strong>
                </div>
                <div className="contract-stat-card">
                    <span>Chờ xác nhận</span>
                    <strong>{stats.waitingConfirm}</strong>
                </div>
                <div className="contract-stat-card">
                    <span>Đã ký</span>
                    <strong>{stats.signed}</strong>
                </div>
                <div className="contract-stat-card">
                    <span>Đã hủy</span>
                    <strong>{stats.canceled}</strong>
                </div>
            </div>

            <div className="admin-toolbar">
                <div className="admin-search">
                    <input
                        type="text"
                        placeholder="Tìm theo mã HĐ, hồ sơ, khách hàng, SĐT, ao nuôi..."
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                    />
                </div>

                <select
                    className="admin-select"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="cho_ky">Chờ ký</option>
                    <option value="cho_xac_nhan">Chờ xác nhận</option>
                    <option value="da_ky">Đã ký</option>
                    <option value="huy">Đã hủy</option>
                </select>

                <button className="admin-secondary-btn" onClick={fetchContracts}>
                    Làm mới
                </button>
            </div>

            <div className="admin-table-card">
                {loading ? (
                    <div className="admin-empty">Đang tải danh sách hợp đồng...</div>
                ) : filteredContracts.length === 0 ? (
                    <div className="admin-empty">Chưa có hợp đồng phù hợp</div>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table contract-table">
                            <thead>
                                <tr>
                                    <th>Mã HĐ</th>
                                    <th>Khách hàng</th>
                                    <th>Hồ sơ</th>
                                    <th>File hợp đồng</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Ngày ký</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContracts.map((contract) => (
                                    <tr key={contract.id_hop_dong}>
                                        <td>
                                            <strong>#{contract.id_hop_dong}</strong>
                                        </td>

                                        <td>
                                            <div className="contract-customer">
                                                <strong>{getCustomerName(contract)}</strong>
                                                <span>{getPhone(contract)}</span>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="contract-profile-cell">
                                                <strong>HS #{contract.id_ho_so}</strong>
                                                <span>
                                                    {contract.HoSoKhachHang?.AoNuoi?.ten_ao || "Chưa có ao"}
                                                </span>
                                                <span>
                                                    {contract.HoSoKhachHang?.VuNuoi?.ten_vu_nuoi ||
                                                        "Chưa có vụ nuôi"}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="contract-file-stack">
                                                {renderFileButton(
                                                    "PDF mẫu",
                                                    contract.file_hop_dong_mau,
                                                    "pdf"
                                                )}
                                                {renderFileButton(
                                                    "PDF đã ký",
                                                    contract.file_hop_dong_da_ky,
                                                    "pdf"
                                                )}
                                                {renderFileButton(
                                                    "Ảnh đã ký",
                                                    contract.anh_hop_dong_da_ky,
                                                    "image"
                                                )}
                                            </div>
                                        </td>

                                        <td>{renderStatusBadge(contract.trang_thai)}</td>

                                        <td>{formatDate(contract.ngay_tao)}</td>

                                        <td>{formatDate(contract.ngay_ky)}</td>

                                        <td>
                                            <div className="contract-actions">
                                                <button
                                                    className="admin-mini-btn"
                                                    onClick={() => openDetail(contract)}
                                                >
                                                    Xem
                                                </button>

                                                {contract.trang_thai !== "huy" &&
                                                    contract.trang_thai !== "da_ky" && (
                                                        <button
                                                            className="admin-mini-btn"
                                                            onClick={() => openUploadModal(contract)}
                                                        >
                                                            Upload
                                                        </button>
                                                    )}

                                                {contract.trang_thai === "cho_xac_nhan" && (
                                                    <button
                                                        className="admin-mini-btn admin-mini-btn--success"
                                                        onClick={() => openConfirmModal(contract)}
                                                    >
                                                        Duyệt
                                                    </button>
                                                )}

                                                {contract.trang_thai !== "huy" && (
                                                    <button
                                                        className="admin-mini-btn admin-mini-btn--danger"
                                                        onClick={() => openCancelModal(contract)}
                                                    >
                                                        Hủy
                                                    </button>
                                                )}

                                                {contract.trang_thai === "huy" && (
                                                    <button
                                                        className="admin-mini-btn"
                                                        onClick={() => openRestoreModal(contract)}
                                                    >
                                                        Khôi phục
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="admin-modal-backdrop">
                    <div className="admin-modal admin-modal--large">
                        <div className="admin-modal__header">
                            <div>
                                <h2>Tạo hợp đồng mua trả sau</h2>
                                <p>
                                    Chọn hồ sơ đã duyệt, hệ thống sẽ tạo PDF hợp đồng mẫu để lưu
                                    riêng.
                                </p>
                            </div>
                            <button onClick={closeAllModal}>×</button>
                        </div>

                        <form onSubmit={handleCreateContract} className="admin-form">
                            <div className="admin-form-grid">
                                <label>
                                    Hồ sơ mua trả sau
                                    <select
                                        value={createForm.id_ho_so || ""}
                                        onChange={(event) => {
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                id_ho_so: Number(event.target.value),
                                            }));
                                            clearPreview();
                                        }}
                                        required
                                    >
                                        <option value="">
                                            {profileLoading
                                                ? "Đang tải hồ sơ..."
                                                : "Chọn hồ sơ đã duyệt"}
                                        </option>

                                        {approvedProfilesWithoutContract.map((profile) => (
                                            <option key={profile.id_ho_so} value={profile.id_ho_so}>
                                                HS #{profile.id_ho_so} -{" "}
                                                {profile.NguoiDung?.ho_ten || "Khách hàng"} -{" "}
                                                {formatCurrency(profile.dinh_muc_cong_no)}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Ghi chú
                                    <input
                                        type="text"
                                        value={createForm.ghi_chu || ""}
                                        onChange={(event) =>
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                ghi_chu: event.target.value,
                                            }))
                                        }
                                        placeholder="Ghi chú nội bộ nếu có"
                                    />
                                </label>
                            </div>

                            <label>
                                Điều khoản bổ sung
                                <textarea
                                    value={extraTerms}
                                    onChange={(event) => {
                                        setExtraTerms(event.target.value);
                                        clearPreview();
                                    }}
                                    placeholder="Nhập điều khoản bổ sung nếu cần đưa vào PDF hợp đồng"
                                    rows={4}
                                />
                            </label>

                            {selectedCreateProfile && (
                                <div className="contract-create-profile">
                                    <div>
                                        <span>Khách hàng</span>
                                        <strong>
                                            {selectedCreateProfile.NguoiDung?.ho_ten || "Chưa có"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Hạn mức</span>
                                        <strong>
                                            {formatCurrency(selectedCreateProfile.dinh_muc_cong_no)}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Hạn thanh toán</span>
                                        <strong>
                                            {formatDate(selectedCreateProfile.han_thanh_toan)}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Ao nuôi</span>
                                        <strong>
                                            {selectedCreateProfile.AoNuoi?.ten_ao || "Chưa có"}
                                        </strong>
                                    </div>
                                </div>
                            )}

                            <div className="contract-pdf-preview-card">
                                <div>
                                    <strong>PDF hợp đồng mẫu</strong>
                                    <p>
                                        File này sẽ lưu vào trường{" "}
                                        <b>file_hop_dong_mau</b>, tách riêng với file đã ký.
                                    </p>
                                </div>

                                <div className="contract-pdf-preview-actions">
                                    <button
                                        type="button"
                                        className="admin-secondary-btn"
                                        onClick={() => handleGeneratePreview()}
                                        disabled={generatingPreview || !selectedCreateProfile}
                                    >
                                        {generatingPreview ? "Đang tạo..." : "Tạo/Xem trước PDF"}
                                    </button>

                                    {previewUrl && (
                                        <a
                                            href={previewUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="admin-secondary-btn"
                                        >
                                            Mở PDF mẫu
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="admin-modal__footer">
                                <button
                                    type="button"
                                    className="admin-secondary-btn"
                                    onClick={closeAllModal}
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    className="admin-primary-btn"
                                    disabled={processing}
                                >
                                    {processing ? "Đang tạo..." : "Tạo hợp đồng"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailModal && selectedContract && (
                <div className="admin-modal-backdrop">
                    <div className="admin-modal admin-modal--large">
                        <div className="admin-modal__header">
                            <div>
                                <h2>Chi tiết hợp đồng #{selectedContract.id_hop_dong}</h2>
                                <p>
                                    Theo dõi PDF mẫu, PDF đã ký và ảnh hợp đồng đã ký ở 2 khu vực
                                    lưu riêng.
                                </p>
                            </div>
                            <button onClick={closeAllModal}>×</button>
                        </div>

                        <div className="contract-detail-layout">
                            <div className="contract-detail-card">
                                <h3>Thông tin khách hàng</h3>

                                <div className="contract-info-grid">
                                    <div>
                                        <span>Khách hàng</span>
                                        <strong>{getCustomerName(selectedContract)}</strong>
                                    </div>
                                    <div>
                                        <span>Số điện thoại</span>
                                        <strong>{getPhone(selectedContract)}</strong>
                                    </div>
                                    <div>
                                        <span>Mã hồ sơ</span>
                                        <strong>#{selectedContract.id_ho_so}</strong>
                                    </div>
                                    <div>
                                        <span>Hạn mức</span>
                                        <strong>
                                            {formatCurrency(
                                                selectedContract.HoSoKhachHang?.dinh_muc_cong_no
                                            )}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Ao nuôi</span>
                                        <strong>
                                            {selectedContract.HoSoKhachHang?.AoNuoi?.ten_ao ||
                                                "Chưa có"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Vụ nuôi</span>
                                        <strong>
                                            {selectedContract.HoSoKhachHang?.VuNuoi?.ten_vu_nuoi ||
                                                "Chưa có"}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            <div className="contract-detail-card">
                                <h3>Trạng thái hợp đồng</h3>

                                <div className="contract-info-grid">
                                    <div>
                                        <span>Trạng thái</span>
                                        <strong>{renderStatusBadge(selectedContract.trang_thai)}</strong>
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
                                    <div>
                                        <span>Ngày xác nhận</span>
                                        <strong>
                                            {formatDate(selectedContract.ngay_xac_nhan)}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Ghi chú</span>
                                        <strong>{selectedContract.ghi_chu || "Không có"}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="contract-file-section">
                            <div className="contract-file-card">
                                <div>
                                    <h3>PDF hợp đồng mẫu</h3>
                                    <p>File được hệ thống tạo trước khi khách ký.</p>
                                </div>

                                {renderFileButton(
                                    "Xem PDF mẫu",
                                    selectedContract.file_hop_dong_mau,
                                    "pdf"
                                )}
                            </div>

                            <div className="contract-file-card">
                                <div>
                                    <h3>PDF hợp đồng đã ký</h3>
                                    <p>File scan hoặc PDF sau khi khách hàng ký.</p>
                                </div>

                                {renderFileButton(
                                    "Xem PDF đã ký",
                                    selectedContract.file_hop_dong_da_ky,
                                    "pdf"
                                )}
                            </div>

                            <div className="contract-file-card contract-file-card--image">
                                <div>
                                    <h3>Ảnh hợp đồng đã ký</h3>
                                    <p>Ảnh chụp nhanh hợp đồng sau khi ký để đối chiếu.</p>
                                </div>

                                {renderSignedImagePreview(selectedContract.anh_hop_dong_da_ky)}
                            </div>
                        </div>

                        <div className="admin-modal__footer">
                            <button
                                type="button"
                                className="admin-secondary-btn"
                                onClick={closeAllModal}
                            >
                                Đóng
                            </button>

                            {selectedContract.trang_thai !== "huy" &&
                                selectedContract.trang_thai !== "da_ky" && (
                                    <button
                                        type="button"
                                        className="admin-primary-btn"
                                        onClick={() => {
                                            setShowDetailModal(false);
                                            openUploadModal(selectedContract);
                                        }}
                                    >
                                        Upload hợp đồng đã ký
                                    </button>
                                )}
                        </div>
                    </div>
                </div>
            )}

            {showUploadModal && selectedContract && (
                <div className="admin-modal-backdrop">
                    <div className="admin-modal admin-modal--large">
                        <div className="admin-modal__header">
                            <div>
                                <h2>Upload hợp đồng đã ký</h2>
                                <p>
                                    Tải lên PDF scan và ảnh chụp hợp đồng đã ký. Hai file được lưu
                                    riêng.
                                </p>
                            </div>
                            <button onClick={closeAllModal}>×</button>
                        </div>

                        <form onSubmit={handleUploadSignedFiles} className="admin-form">
                            <div className="contract-upload-grid">
                                <label className="contract-upload-box">
                                    <span>PDF hợp đồng đã ký</span>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleChooseSignedPdf}
                                    />
                                    {uploadPdfFile ? (
                                        <strong>
                                            {uploadPdfFile.name} ({formatFileSize(uploadPdfFile.size)})
                                        </strong>
                                    ) : (
                                        <small>Chọn file PDF tối đa 10MB</small>
                                    )}
                                </label>

                                <label className="contract-upload-box">
                                    <span>Ảnh hợp đồng đã ký</span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleChooseSignedImage}
                                    />
                                    {uploadImageFile ? (
                                        <strong>
                                            {uploadImageFile.name} (
                                            {formatFileSize(uploadImageFile.size)})
                                        </strong>
                                    ) : (
                                        <small>Chọn ảnh JPG, PNG, WEBP tối đa 5MB</small>
                                    )}
                                </label>
                            </div>

                            <div className="admin-form-grid">
                                <label>
                                    Ngày ký
                                    <input
                                        type="date"
                                        value={uploadForm.ngay_ky}
                                        onChange={(event) =>
                                            setUploadForm((prev) => ({
                                                ...prev,
                                                ngay_ky: event.target.value,
                                            }))
                                        }
                                    />
                                </label>

                                <label>
                                    Ghi chú
                                    <input
                                        type="text"
                                        value={uploadForm.ghi_chu}
                                        onChange={(event) =>
                                            setUploadForm((prev) => ({
                                                ...prev,
                                                ghi_chu: event.target.value,
                                            }))
                                        }
                                        placeholder="Ghi chú sau khi ký"
                                    />
                                </label>
                            </div>

                            <div className="contract-current-files">
                                <div>
                                    <span>PDF hiện tại</span>
                                    {renderFileButton(
                                        "Xem PDF đã ký",
                                        selectedContract.file_hop_dong_da_ky,
                                        "pdf"
                                    )}
                                </div>

                                <div>
                                    <span>Ảnh hiện tại</span>
                                    {renderFileButton(
                                        "Xem ảnh đã ký",
                                        selectedContract.anh_hop_dong_da_ky,
                                        "image"
                                    )}
                                </div>
                            </div>

                            <div className="admin-modal__footer">
                                <button
                                    type="button"
                                    className="admin-secondary-btn"
                                    onClick={closeAllModal}
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    className="admin-primary-btn"
                                    disabled={processing}
                                >
                                    {processing ? "Đang upload..." : "Lưu file đã ký"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showConfirmModal && selectedContract && (
                <div className="admin-modal-backdrop">
                    <div className="admin-modal">
                        <div className="admin-modal__header">
                            <div>
                                <h2>Xác nhận hợp đồng</h2>
                                <p>
                                    Sau khi xác nhận, hợp đồng chuyển sang trạng thái đã ký.
                                </p>
                            </div>
                            <button onClick={closeAllModal}>×</button>
                        </div>

                        <div className="admin-form">
                            <label>
                                Ghi chú xác nhận
                                <textarea
                                    value={confirmNote}
                                    onChange={(event) => setConfirmNote(event.target.value)}
                                    rows={4}
                                    placeholder="Nhập ghi chú nếu có"
                                />
                            </label>

                            <div className="admin-modal__footer">
                                <button
                                    type="button"
                                    className="admin-secondary-btn"
                                    onClick={closeAllModal}
                                >
                                    Hủy
                                </button>

                                <button
                                    type="button"
                                    className="admin-primary-btn"
                                    disabled={processing}
                                    onClick={handleConfirmContract}
                                >
                                    {processing ? "Đang xác nhận..." : "Xác nhận"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCancelModal && selectedContract && (
                <div className="admin-modal-backdrop">
                    <div className="admin-modal">
                        <div className="admin-modal__header">
                            <div>
                                <h2>Hủy hợp đồng</h2>
                                <p>Hợp đồng sẽ chuyển sang trạng thái đã hủy.</p>
                            </div>
                            <button onClick={closeAllModal}>×</button>
                        </div>

                        <div className="admin-form">
                            <label>
                                Lý do / ghi chú hủy
                                <textarea
                                    value={cancelNote}
                                    onChange={(event) => setCancelNote(event.target.value)}
                                    rows={4}
                                    placeholder="Nhập lý do hủy nếu có"
                                />
                            </label>

                            <div className="admin-modal__footer">
                                <button
                                    type="button"
                                    className="admin-secondary-btn"
                                    onClick={closeAllModal}
                                >
                                    Đóng
                                </button>

                                <button
                                    type="button"
                                    className="admin-danger-btn"
                                    disabled={processing}
                                    onClick={handleCancelContract}
                                >
                                    {processing ? "Đang hủy..." : "Hủy hợp đồng"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showRestoreModal && selectedContract && (
                <div className="admin-modal-backdrop">
                    <div className="admin-modal">
                        <div className="admin-modal__header">
                            <div>
                                <h2>Khôi phục hợp đồng</h2>
                                <p>Hợp đồng sẽ quay lại trạng thái chờ ký.</p>
                            </div>
                            <button onClick={closeAllModal}>×</button>
                        </div>

                        <div className="admin-form">
                            <label>
                                Ghi chú khôi phục
                                <textarea
                                    value={restoreNote}
                                    onChange={(event) => setRestoreNote(event.target.value)}
                                    rows={4}
                                    placeholder="Nhập ghi chú nếu có"
                                />
                            </label>

                            <div className="admin-modal__footer">
                                <button
                                    type="button"
                                    className="admin-secondary-btn"
                                    onClick={closeAllModal}
                                >
                                    Đóng
                                </button>

                                <button
                                    type="button"
                                    className="admin-primary-btn"
                                    disabled={processing}
                                    onClick={handleRestoreContract}
                                >
                                    {processing ? "Đang khôi phục..." : "Khôi phục"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}