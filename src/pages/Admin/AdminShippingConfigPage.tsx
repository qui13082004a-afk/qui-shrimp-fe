import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./AdminCommon.css";
import "./AdminShippingConfigPage.css";
import {
  locationService,
  type CoordinateResolution,
  type Province,
} from "../../services/location.service";
import {
  businessAreaService,
  type BusinessArea,
  type BusinessAreaPayload,
} from "../../services/businessArea.service";
import {
  departurePointService,
  type DeparturePoint,
  type DeparturePointPayload,
} from "../../services/departurePoint.service";
import {
  shippingFeeService,
  type ShippingFee,
  type ShippingFeePayload,
} from "../../services/shippingFee.service";

type TabKey = "business-area" | "departure-point" | "shipping-fee";
type ModalType = "business-area" | "departure-point" | "shipping-fee" | null;

const defaultMapCenter: [number, number] = [10.0452, 105.7469];

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type DeparturePointMapProps = {
  lat?: string | number;
  lng?: string | number;
  onPick: (lat: number, lng: number) => void;
};

function MapCenter({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    window.setTimeout(() => map.invalidateSize(), 80);
    map.setView(position, map.getZoom());
  }, [map, position]);

  return null;
}

function DeparturePointMap({ lat, lng, onPick }: DeparturePointMapProps) {
  const currentLat = Number(lat);
  const currentLng = Number(lng);
  const hasPosition =
    Number.isFinite(currentLat) &&
    Number.isFinite(currentLng) &&
    currentLat >= -90 &&
    currentLat <= 90 &&
    currentLng >= -180 &&
    currentLng <= 180;
  const position: [number, number] = hasPosition
    ? [currentLat, currentLng]
    : defaultMapCenter;

  function MapClickHandler() {
    useMapEvents({
      click(event) {
        onPick(
          Number(event.latlng.lat.toFixed(7)),
          Number(event.latlng.lng.toFixed(7))
        );
      },
    });
    return null;
  }

  return (
    <div className="shipping-map">
      <MapContainer
        center={position}
        zoom={hasPosition ? 14 : 11}
        scrollWheelZoom
        className="shipping-map__canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenter position={position} />
        <MapClickHandler />
        {hasPosition && (
          <Marker
            position={position}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend(event) {
                const marker = event.target;
                const nextPosition = marker.getLatLng();
                onPick(
                  Number(nextPosition.lat.toFixed(7)),
                  Number(nextPosition.lng.toFixed(7))
                );
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

const initialBusinessAreaForm: BusinessAreaPayload = {
  id_tinh_thanh: "",
  cho_phep_ban_hang: false,
  cho_phep_tra_sau: false,
  dang_hoat_dong: true,
  ban_kinh_toi_da_km: "",
  phi_van_chuyen_mac_dinh: 0,
  ghi_chu: "",
};

const initialDeparturePointForm: DeparturePointPayload = {
  ten_diem: "",
  dia_chi: "",
  vi_do: "",
  kinh_do: "",
  ban_kinh_toi_da_km: "",
  dang_hoat_dong: true,
  la_mac_dinh: true,
};

const initialShippingFeeForm: ShippingFeePayload = {
  id_khu_vuc: "",
  tu_km: 0,
  den_km: "",
  phi_co_dinh: 0,
  dang_hoat_dong: true,
};

const formatCurrency = (value?: string | number | null) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatDistance = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "Chua cau hinh";
  return `${Number(value).toLocaleString("vi-VN")} km`;
};

const getProvinceName = (area?: BusinessArea | null) => {
  return area?.TinhThanh?.ten_tinh || `Tinh #${area?.id_tinh_thanh || ""}`;
};

const getProvinceCode = (area?: BusinessArea | null) => {
  return area?.TinhThanh?.ma_tinh || "-";
};

export default function AdminShippingConfigPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("business-area");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [businessAreas, setBusinessAreas] = useState<BusinessArea[]>([]);
  const [departurePoints, setDeparturePoints] = useState<DeparturePoint[]>([]);
  const [shippingFees, setShippingFees] = useState<ShippingFee[]>([]);

  const [businessAreaForm, setBusinessAreaForm] =
    useState<BusinessAreaPayload>(initialBusinessAreaForm);
  const [departurePointForm, setDeparturePointForm] =
    useState<DeparturePointPayload>(initialDeparturePointForm);
  const [shippingFeeForm, setShippingFeeForm] =
    useState<ShippingFeePayload>(initialShippingFeeForm);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resolvingCoordinate, setResolvingCoordinate] = useState(false);
  const [coordinateInfo, setCoordinateInfo] =
    useState<CoordinateResolution | null>(null);
  const [message, setMessage] = useState("");

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [provinceRes, areaRes, pointRes, feeRes] = await Promise.all([
        locationService.getProvinces(),
        businessAreaService.getBusinessAreas(),
        departurePointService.getDeparturePoints(),
        shippingFeeService.getShippingFees(),
      ]);

      setProvinces(Array.isArray(provinceRes.data) ? provinceRes.data : []);
      setBusinessAreas(Array.isArray(areaRes.data) ? areaRes.data : []);
      setDeparturePoints(Array.isArray(pointRes.data) ? pointRes.data : []);
      setShippingFees(Array.isArray(feeRes.data) ? feeRes.data : []);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          "Khong tai duoc du lieu cau hinh khu vuc va van chuyen"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredBusinessAreas = useMemo(() => {
    return businessAreas.filter((area) => {
      const searchText = `${area.TinhThanh?.ten_tinh || ""} ${
        area.TinhThanh?.ma_tinh || ""
      } ${area.ghi_chu || ""}`.toLowerCase();
      const matchKeyword = searchText.includes(keyword.toLowerCase().trim());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && area.dang_hoat_dong) ||
        (statusFilter === "inactive" && !area.dang_hoat_dong);
      return matchKeyword && matchStatus;
    });
  }, [businessAreas, keyword, statusFilter]);

  const filteredDeparturePoints = useMemo(() => {
    return departurePoints.filter((point) => {
      const searchText = `${point.ten_diem} ${point.dia_chi}`.toLowerCase();
      const matchKeyword = searchText.includes(keyword.toLowerCase().trim());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && point.dang_hoat_dong) ||
        (statusFilter === "inactive" && !point.dang_hoat_dong);
      return matchKeyword && matchStatus;
    });
  }, [departurePoints, keyword, statusFilter]);

  const filteredShippingFees = useMemo(() => {
    return shippingFees.filter((fee) => {
      const searchText = `${getProvinceName(fee.KhuVucKinhDoanh)}`.toLowerCase();
      const matchKeyword = searchText.includes(keyword.toLowerCase().trim());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && fee.dang_hoat_dong) ||
        (statusFilter === "inactive" && !fee.dang_hoat_dong);
      return matchKeyword && matchStatus;
    });
  }, [shippingFees, keyword, statusFilter]);

  const stats = useMemo(() => {
    return {
      areas: businessAreas.length,
      activeAreas: businessAreas.filter((item) => item.dang_hoat_dong).length,
      departurePoints: departurePoints.length,
      shippingFees: shippingFees.length,
    };
  }, [businessAreas, departurePoints, shippingFees]);

  const resetModal = () => {
    setModalType(null);
    setEditingId(null);
    setBusinessAreaForm(initialBusinessAreaForm);
    setDeparturePointForm(initialDeparturePointForm);
    setShippingFeeForm(initialShippingFeeForm);
    setCoordinateInfo(null);
  };

  const handleImportWards = async () => {
    try {
      setImporting(true);
      const result = await locationService.importWards();
      setMessage(
        `Import thanh cong ${result.data.so_tinh_thanh} tinh/thanh va ${result.data.so_phuong_xa} phuong/xa`
      );
      fetchAll();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Import du lieu tinh/xa that bai");
    } finally {
      setImporting(false);
    }
  };

  const openCreateModal = (type: Exclude<ModalType, null>) => {
    setEditingId(null);
    setModalType(type);

    if (type === "business-area") setBusinessAreaForm(initialBusinessAreaForm);
    if (type === "departure-point") setDeparturePointForm(initialDeparturePointForm);
    if (type === "shipping-fee") setShippingFeeForm(initialShippingFeeForm);
  };

  const openBusinessAreaEdit = (area: BusinessArea) => {
    setEditingId(area.id_khu_vuc);
    setBusinessAreaForm({
      id_tinh_thanh: area.id_tinh_thanh,
      cho_phep_ban_hang: area.cho_phep_ban_hang,
      cho_phep_tra_sau: area.cho_phep_tra_sau,
      dang_hoat_dong: area.dang_hoat_dong,
      ban_kinh_toi_da_km: area.ban_kinh_toi_da_km ?? "",
      phi_van_chuyen_mac_dinh: area.phi_van_chuyen_mac_dinh ?? 0,
      ghi_chu: area.ghi_chu || "",
    });
    setModalType("business-area");
  };

  const openDeparturePointEdit = (point: DeparturePoint) => {
    setEditingId(point.id_diem_xuat_phat);
    setDeparturePointForm({
      ten_diem: point.ten_diem,
      dia_chi: point.dia_chi,
      vi_do: point.vi_do,
      kinh_do: point.kinh_do,
      ban_kinh_toi_da_km: point.ban_kinh_toi_da_km ?? "",
      dang_hoat_dong: point.dang_hoat_dong,
      la_mac_dinh: point.la_mac_dinh,
    });
    setCoordinateInfo(null);
    setModalType("departure-point");
  };

  const openShippingFeeEdit = (fee: ShippingFee) => {
    setEditingId(fee.id_muc_phi);
    setShippingFeeForm({
      id_khu_vuc: fee.id_khu_vuc,
      tu_km: fee.tu_km,
      den_km: fee.den_km ?? "",
      phi_co_dinh: fee.phi_co_dinh,
      dang_hoat_dong: fee.dang_hoat_dong,
    });
    setModalType("shipping-fee");
  };

  const handleBusinessAreaChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;
    setBusinessAreaForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDeparturePointChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;
    setDeparturePointForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePickDeparturePoint = (lat: number, lng: number) => {
    setDeparturePointForm((prev) => ({
      ...prev,
      vi_do: lat,
      kinh_do: lng,
    }));
    resolvePickedCoordinate(lat, lng);
  };

  const resolvePickedCoordinate = async (lat: number, lng: number) => {
    try {
      setResolvingCoordinate(true);
      const result = await locationService.resolveCoordinate({
        vi_do: lat,
        kinh_do: lng,
      });
      setCoordinateInfo(result.data);
    } catch (error: any) {
      setCoordinateInfo(null);
      setMessage(error?.response?.data?.message || "Khong kiem tra duoc dia gioi toa do");
    } finally {
      setResolvingCoordinate(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Trinh duyet khong ho tro lay vi tri hien tai");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handlePickDeparturePoint(
          Number(position.coords.latitude.toFixed(7)),
          Number(position.coords.longitude.toFixed(7))
        );
      },
      () => {
        setMessage("Khong lay duoc vi tri hien tai");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  useEffect(() => {
    if (modalType !== "departure-point" || editingId || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handlePickDeparturePoint(
          Number(position.coords.latitude.toFixed(7)),
          Number(position.coords.longitude.toFixed(7))
        );
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, [modalType, editingId]);

  const handleShippingFeeChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;
    setShippingFeeForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveBusinessArea = async (event: FormEvent) => {
    event.preventDefault();
    if (!businessAreaForm.id_tinh_thanh && !editingId) {
      setMessage("Vui long chon tinh/thanh");
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await businessAreaService.updateBusinessArea(editingId, businessAreaForm);
        setMessage("Cap nhat khu vuc kinh doanh thanh cong");
      } else {
        await businessAreaService.createBusinessArea(businessAreaForm);
        setMessage("Them khu vuc kinh doanh thanh cong");
      }
      resetModal();
      fetchAll();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Luu khu vuc kinh doanh that bai");
    } finally {
      setSaving(false);
    }
  };

  const saveDeparturePoint = async (event: FormEvent) => {
    event.preventDefault();
    if (!String(departurePointForm.ten_diem || "").trim()) {
      setMessage("Vui long nhap ten diem xuat phat");
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await departurePointService.updateDeparturePoint(editingId, departurePointForm);
        setMessage("Cap nhat diem xuat phat thanh cong");
      } else {
        await departurePointService.createDeparturePoint(departurePointForm);
        setMessage("Them diem xuat phat thanh cong");
      }
      resetModal();
      fetchAll();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Luu diem xuat phat that bai");
    } finally {
      setSaving(false);
    }
  };

  const saveShippingFee = async (event: FormEvent) => {
    event.preventDefault();
    if (!shippingFeeForm.id_khu_vuc && !editingId) {
      setMessage("Vui long chon khu vuc ap dung");
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await shippingFeeService.updateShippingFee(editingId, shippingFeeForm);
        setMessage("Cap nhat muc phi van chuyen thanh cong");
      } else {
        await shippingFeeService.createShippingFee(shippingFeeForm);
        setMessage("Them muc phi van chuyen thanh cong");
      }
      resetModal();
      fetchAll();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Luu muc phi van chuyen that bai");
    } finally {
      setSaving(false);
    }
  };

  const toggleBusinessArea = async (
    area: BusinessArea,
    field: "cho_phep_ban_hang" | "cho_phep_tra_sau" | "dang_hoat_dong"
  ) => {
    try {
      setLoading(true);
      await businessAreaService.updateBusinessArea(area.id_khu_vuc, {
        [field]: !area[field],
      });
      setMessage("Cap nhat khu vuc kinh doanh thanh cong");
      fetchAll();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Cap nhat that bai");
    } finally {
      setLoading(false);
    }
  };

  const toggleDeparturePoint = async (
    point: DeparturePoint,
    field: "dang_hoat_dong" | "la_mac_dinh"
  ) => {
    try {
      setLoading(true);
      await departurePointService.updateDeparturePoint(point.id_diem_xuat_phat, {
        [field]: !point[field],
      });
      setMessage("Cap nhat diem xuat phat thanh cong");
      fetchAll();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Cap nhat that bai");
    } finally {
      setLoading(false);
    }
  };

  const toggleShippingFee = async (fee: ShippingFee) => {
    try {
      setLoading(true);
      await shippingFeeService.updateShippingFee(fee.id_muc_phi, {
        dang_hoat_dong: !fee.dang_hoat_dong,
      });
      setMessage("Cap nhat muc phi van chuyen thanh cong");
      fetchAll();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Cap nhat that bai");
    } finally {
      setLoading(false);
    }
  };

  const renderToggle = (
    checked: boolean,
    label: string,
    onClick: () => void
  ) => (
    <button
      type="button"
      className={`shipping-toggle ${checked ? "shipping-toggle--on" : ""}`}
      onClick={onClick}
      aria-label={label}
    >
      <span />
    </button>
  );

  return (
    <div className="admin-page shipping-config-page">
      <div className="admin-page__header admin-page__header--between shipping-config-header">
        <div>
          <p className="admin-page__eyebrow">Van chuyen</p>
          <h1>Khu vuc & van chuyen</h1>
          <p>Quan ly tinh duoc ban hang, diem xuat phat va muc phi van chuyen.</p>
        </div>

        <button
          type="button"
          className="admin-secondary-btn shipping-import-btn"
          onClick={handleImportWards}
          disabled={importing}
        >
          {importing ? "Dang import..." : "Import tinh/xa"}
        </button>
      </div>

      {message && (
        <div className="admin-alert shipping-config-alert">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")}>
            x
          </button>
        </div>
      )}

      <div className="shipping-config-stats">
        <div className="shipping-config-stat-card">
          <span>Khu vuc</span>
          <strong>{stats.areas}</strong>
          <p>Tinh/thanh da cau hinh</p>
        </div>
        <div className="shipping-config-stat-card">
          <span>Dang hoat dong</span>
          <strong>{stats.activeAreas}</strong>
          <p>Khu vuc dang phuc vu</p>
        </div>
        <div className="shipping-config-stat-card">
          <span>Diem xuat phat</span>
          <strong>{stats.departurePoints}</strong>
          <p>Kho/cua hang da cau hinh</p>
        </div>
        <div className="shipping-config-stat-card">
          <span>Muc phi</span>
          <strong>{stats.shippingFees}</strong>
          <p>Khoang phi van chuyen</p>
        </div>
      </div>

      <div className="shipping-tabs">
        <button
          type="button"
          className={activeTab === "business-area" ? "active" : ""}
          onClick={() => setActiveTab("business-area")}
        >
          Khu vuc kinh doanh
        </button>
        <button
          type="button"
          className={activeTab === "departure-point" ? "active" : ""}
          onClick={() => setActiveTab("departure-point")}
        >
          Diem xuat phat
        </button>
        <button
          type="button"
          className={activeTab === "shipping-fee" ? "active" : ""}
          onClick={() => setActiveTab("shipping-fee")}
        >
          Muc phi van chuyen
        </button>
      </div>

      <div className="admin-card shipping-config-card">
        <div className="shipping-config-card__top">
          <div>
            <h2>
              {activeTab === "business-area" && "Danh sach khu vuc kinh doanh"}
              {activeTab === "departure-point" && "Danh sach diem xuat phat"}
              {activeTab === "shipping-fee" && "Danh sach muc phi van chuyen"}
            </h2>
            <p>Tim kiem, loc va cap nhat cau hinh theo dung contract backend.</p>
          </div>

          <button
            type="button"
            className="admin-primary-btn"
            onClick={() => openCreateModal(activeTab)}
          >
            + Them moi
          </button>
        </div>

        <div className="admin-toolbar shipping-config-toolbar">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tim theo ten tinh, ten diem, khu vuc..."
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Tat ca trang thai</option>
            <option value="active">Dang hoat dong</option>
            <option value="inactive">Tam tat</option>
          </select>
        </div>

        {activeTab === "business-area" && (
          <div className="admin-table-wrap">
            <table className="admin-table shipping-config-table">
              <thead>
                <tr>
                  <th>Tinh/thanh</th>
                  <th>Ban hang</th>
                  <th>Tra sau</th>
                  <th>Ban kinh</th>
                  <th>Phi mac dinh</th>
                  <th>Trang thai</th>
                  <th>Ghi chu</th>
                  <th>Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="shipping-empty">Dang tai du lieu...</div>
                    </td>
                  </tr>
                ) : filteredBusinessAreas.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="shipping-empty">
                        <strong>Chua co khu vuc phu hop</strong>
                        <span>Hay them khu vuc hoac thay doi bo loc.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBusinessAreas.map((area) => (
                    <tr key={area.id_khu_vuc}>
                      <td>
                        <strong>{getProvinceName(area)}</strong>
                        <span>Ma tinh: {getProvinceCode(area)}</span>
                      </td>
                      <td>
                        {renderToggle(area.cho_phep_ban_hang, "Ban hang", () =>
                          toggleBusinessArea(area, "cho_phep_ban_hang")
                        )}
                      </td>
                      <td>
                        {renderToggle(area.cho_phep_tra_sau, "Tra sau", () =>
                          toggleBusinessArea(area, "cho_phep_tra_sau")
                        )}
                      </td>
                      <td>{formatDistance(area.ban_kinh_toi_da_km)}</td>
                      <td>
                        <strong>{formatCurrency(area.phi_van_chuyen_mac_dinh)}</strong>
                      </td>
                      <td>
                        {renderToggle(area.dang_hoat_dong, "Trang thai", () =>
                          toggleBusinessArea(area, "dang_hoat_dong")
                        )}
                      </td>
                      <td>{area.ghi_chu || "-"}</td>
                      <td>
                        <button
                          type="button"
                          className="shipping-action-btn"
                          onClick={() => openBusinessAreaEdit(area)}
                        >
                          Sua
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "departure-point" && (
          <div className="admin-table-wrap">
            <table className="admin-table shipping-config-table">
              <thead>
                <tr>
                  <th>Ten diem</th>
                  <th>Dia chi</th>
                  <th>Toa do</th>
                  <th>Ban kinh</th>
                  <th>Trang thai</th>
                  <th>Mac dinh</th>
                  <th>Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="shipping-empty">Dang tai du lieu...</div>
                    </td>
                  </tr>
                ) : filteredDeparturePoints.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="shipping-empty">
                        <strong>Chua co diem xuat phat phu hop</strong>
                        <span>Hay them kho/cua hang hoac thay doi bo loc.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDeparturePoints.map((point) => (
                    <tr key={point.id_diem_xuat_phat}>
                      <td>
                        <strong>{point.ten_diem}</strong>
                      </td>
                      <td>{point.dia_chi}</td>
                      <td>
                        <span>{point.vi_do}</span>
                        <span>{point.kinh_do}</span>
                      </td>
                      <td>{formatDistance(point.ban_kinh_toi_da_km)}</td>
                      <td>
                        {renderToggle(point.dang_hoat_dong, "Trang thai", () =>
                          toggleDeparturePoint(point, "dang_hoat_dong")
                        )}
                      </td>
                      <td>
                        {renderToggle(point.la_mac_dinh, "Mac dinh", () =>
                          toggleDeparturePoint(point, "la_mac_dinh")
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="shipping-action-btn"
                          onClick={() => openDeparturePointEdit(point)}
                        >
                          Sua
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "shipping-fee" && (
          <div className="admin-table-wrap">
            <table className="admin-table shipping-config-table">
              <thead>
                <tr>
                  <th>Khu vuc</th>
                  <th>Tu km</th>
                  <th>Den km</th>
                  <th>Phi van chuyen</th>
                  <th>Trang thai</th>
                  <th>Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="shipping-empty">Dang tai du lieu...</div>
                    </td>
                  </tr>
                ) : filteredShippingFees.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="shipping-empty">
                        <strong>Chua co muc phi phu hop</strong>
                        <span>Hay them muc phi hoac thay doi bo loc.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredShippingFees.map((fee) => (
                    <tr key={fee.id_muc_phi}>
                      <td>
                        <strong>{getProvinceName(fee.KhuVucKinhDoanh)}</strong>
                        <span>Ma tinh: {getProvinceCode(fee.KhuVucKinhDoanh)}</span>
                      </td>
                      <td>{formatDistance(fee.tu_km)}</td>
                      <td>{fee.den_km ? formatDistance(fee.den_km) : "Khong gioi han"}</td>
                      <td>
                        <strong>{formatCurrency(fee.phi_co_dinh)}</strong>
                      </td>
                      <td>
                        {renderToggle(fee.dang_hoat_dong, "Trang thai", () =>
                          toggleShippingFee(fee)
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="shipping-action-btn"
                          onClick={() => openShippingFeeEdit(fee)}
                        >
                          Sua
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalType === "business-area" && (
        <div className="admin-modal-overlay">
          <div className="admin-modal shipping-modal">
            <div className="admin-modal__header">
              <div>
                <h2>{editingId ? "Cap nhat khu vuc" : "Them khu vuc"}</h2>
                <p>Thiet lap quyen ban hang, tra sau va phi mac dinh theo tinh.</p>
              </div>
              <button className="admin-modal__close" onClick={resetModal}>
                x
              </button>
            </div>

            <form className="shipping-form" onSubmit={saveBusinessArea}>
              <div className="shipping-form-grid">
                <label>
                  Tinh/thanh
                  <select
                    name="id_tinh_thanh"
                    value={businessAreaForm.id_tinh_thanh || ""}
                    onChange={handleBusinessAreaChange}
                    disabled={Boolean(editingId)}
                  >
                    <option value="">Chon tinh/thanh</option>
                    {provinces.map((province) => (
                      <option
                        key={province.id_tinh_thanh}
                        value={province.id_tinh_thanh}
                      >
                        {province.ma_tinh} - {province.ten_tinh}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Ban kinh toi da (km)
                  <input
                    type="number"
                    name="ban_kinh_toi_da_km"
                    min={0}
                    value={businessAreaForm.ban_kinh_toi_da_km || ""}
                    onChange={handleBusinessAreaChange}
                  />
                </label>

                <label>
                  Phi van chuyen mac dinh
                  <input
                    type="number"
                    name="phi_van_chuyen_mac_dinh"
                    min={0}
                    value={businessAreaForm.phi_van_chuyen_mac_dinh || 0}
                    onChange={handleBusinessAreaChange}
                  />
                </label>

                <div className="shipping-form-checks">
                  <label>
                    <input
                      type="checkbox"
                      name="cho_phep_ban_hang"
                      checked={Boolean(businessAreaForm.cho_phep_ban_hang)}
                      onChange={handleBusinessAreaChange}
                    />
                    Cho phep ban hang
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="cho_phep_tra_sau"
                      checked={Boolean(businessAreaForm.cho_phep_tra_sau)}
                      onChange={handleBusinessAreaChange}
                    />
                    Cho phep tra sau
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="dang_hoat_dong"
                      checked={Boolean(businessAreaForm.dang_hoat_dong)}
                      onChange={handleBusinessAreaChange}
                    />
                    Dang hoat dong
                  </label>
                </div>

                <label className="shipping-form-grid__full">
                  Ghi chu
                  <textarea
                    name="ghi_chu"
                    value={businessAreaForm.ghi_chu || ""}
                    onChange={handleBusinessAreaChange}
                  />
                </label>
              </div>

              <div className="admin-modal__actions">
                <button type="button" className="admin-secondary-btn" onClick={resetModal}>
                  Huy
                </button>
                <button type="submit" className="admin-primary-btn" disabled={saving}>
                  {saving ? "Dang luu..." : "Luu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === "departure-point" && (
        <div className="admin-modal-overlay">
          <div className="admin-modal shipping-modal">
            <div className="admin-modal__header">
              <div>
                <h2>{editingId ? "Cap nhat diem xuat phat" : "Them diem xuat phat"}</h2>
                <p>Thiet lap kho/cua hang mac dinh de tinh khoang cach.</p>
              </div>
              <button className="admin-modal__close" onClick={resetModal}>
                x
              </button>
            </div>

            <form className="shipping-form" onSubmit={saveDeparturePoint}>
              <div className="shipping-form-grid">
                <label>
                  Ten kho/cua hang
                  <input
                    name="ten_diem"
                    value={departurePointForm.ten_diem || ""}
                    onChange={handleDeparturePointChange}
                  />
                </label>
                <label>
                  Dia chi
                  <input
                    name="dia_chi"
                    value={departurePointForm.dia_chi || ""}
                    onChange={handleDeparturePointChange}
                  />
                </label>
                <label>
                  Vi do
                  <input
                    type="number"
                    name="vi_do"
                    value={departurePointForm.vi_do || ""}
                    onChange={handleDeparturePointChange}
                  />
                </label>
                <label>
                  Kinh do
                  <input
                    type="number"
                    name="kinh_do"
                    value={departurePointForm.kinh_do || ""}
                    onChange={handleDeparturePointChange}
                  />
                </label>
                <div className="shipping-form-grid__full">
                  <div className="shipping-map-header">
                    <div>
                      <strong>Chon toa do tren ban do</strong>
                      <span>Click vao ban do hoac keo marker de tu dien vi do, kinh do.</span>
                    </div>
                    <button
                      type="button"
                      className="admin-secondary-btn"
                      onClick={handleUseCurrentLocation}
                    >
                      Lay vi tri hien tai
                    </button>
                  </div>
                  <DeparturePointMap
                    lat={departurePointForm.vi_do}
                    lng={departurePointForm.kinh_do}
                    onPick={handlePickDeparturePoint}
                  />
                  <div className="shipping-coordinate-result">
                    {resolvingCoordinate ? (
                      <span>Dang kiem tra toa do...</span>
                    ) : coordinateInfo?.tim_thay && coordinateInfo.dia_gioi ? (
                      <span>
                        Toa do thuoc {coordinateInfo.dia_gioi.cap_xa}{" "}
                        <strong>{coordinateInfo.dia_gioi.ten_xa}</strong>, tinh/thanh{" "}
                        <strong>{coordinateInfo.dia_gioi.ten_tinh}</strong>
                      </span>
                    ) : coordinateInfo ? (
                      <span>Chua xac dinh duoc xa/tinh tu toa do nay.</span>
                    ) : (
                      <span>Click tren ban do de kiem tra toa do thuoc xa/tinh nao.</span>
                    )}
                  </div>
                </div>
                <label>
                  Ban kinh toi da (km)
                  <input
                    type="number"
                    name="ban_kinh_toi_da_km"
                    min={0}
                    value={departurePointForm.ban_kinh_toi_da_km || ""}
                    onChange={handleDeparturePointChange}
                  />
                </label>
                <div className="shipping-form-checks">
                  <label>
                    <input
                      type="checkbox"
                      name="dang_hoat_dong"
                      checked={Boolean(departurePointForm.dang_hoat_dong)}
                      onChange={handleDeparturePointChange}
                    />
                    Dang hoat dong
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="la_mac_dinh"
                      checked={Boolean(departurePointForm.la_mac_dinh)}
                      onChange={handleDeparturePointChange}
                    />
                    Diem mac dinh
                  </label>
                </div>
              </div>

              <div className="admin-modal__actions">
                <button type="button" className="admin-secondary-btn" onClick={resetModal}>
                  Huy
                </button>
                <button type="submit" className="admin-primary-btn" disabled={saving}>
                  {saving ? "Dang luu..." : "Luu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === "shipping-fee" && (
        <div className="admin-modal-overlay">
          <div className="admin-modal shipping-modal">
            <div className="admin-modal__header">
              <div>
                <h2>{editingId ? "Cap nhat muc phi" : "Them muc phi"}</h2>
                <p>Thiet lap phi co dinh theo khu vuc va khoang cach.</p>
              </div>
              <button className="admin-modal__close" onClick={resetModal}>
                x
              </button>
            </div>

            <form className="shipping-form" onSubmit={saveShippingFee}>
              <div className="shipping-form-grid">
                <label>
                  Khu vuc ap dung
                  <select
                    name="id_khu_vuc"
                    value={shippingFeeForm.id_khu_vuc || ""}
                    onChange={handleShippingFeeChange}
                    disabled={Boolean(editingId)}
                  >
                    <option value="">Chon khu vuc</option>
                    {businessAreas.map((area) => (
                      <option key={area.id_khu_vuc} value={area.id_khu_vuc}>
                        {getProvinceName(area)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Tu km
                  <input
                    type="number"
                    name="tu_km"
                    min={0}
                    value={shippingFeeForm.tu_km || 0}
                    onChange={handleShippingFeeChange}
                  />
                </label>
                <label>
                  Den km
                  <input
                    type="number"
                    name="den_km"
                    min={0}
                    value={shippingFeeForm.den_km || ""}
                    onChange={handleShippingFeeChange}
                  />
                </label>
                <label>
                  Phi van chuyen
                  <input
                    type="number"
                    name="phi_co_dinh"
                    min={0}
                    value={shippingFeeForm.phi_co_dinh || 0}
                    onChange={handleShippingFeeChange}
                  />
                </label>
                <div className="shipping-form-checks">
                  <label>
                    <input
                      type="checkbox"
                      name="dang_hoat_dong"
                      checked={Boolean(shippingFeeForm.dang_hoat_dong)}
                      onChange={handleShippingFeeChange}
                    />
                    Dang hoat dong
                  </label>
                </div>
              </div>

              <div className="admin-modal__actions">
                <button type="button" className="admin-secondary-btn" onClick={resetModal}>
                  Huy
                </button>
                <button type="submit" className="admin-primary-btn" disabled={saving}>
                  {saving ? "Dang luu..." : "Luu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
