import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { PondPayload } from "../../../services/pond.service";
import {
  locationService,
  type CoordinateResolution,
  type Province,
  type Ward,
} from "../../../services/location.service";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface PondModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  formData: PondPayload;
  onChange: (data: PondPayload) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

interface PondMapProps {
  position: [number, number];
  onPick: (lat: number, lng: number) => void;
}

const MapCenter: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    window.setTimeout(() => map.invalidateSize(), 80);
    map.setView(position, map.getZoom());
  }, [map, position]);

  return null;
};

const PondMap: React.FC<PondMapProps> = ({ position, onPick }) => {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return (
    <>
      <MapCenter position={position} />
      <Marker
        position={position}
        draggable
        eventHandlers={{
          dragend(event) {
            const marker = event.target as L.Marker;
            const next = marker.getLatLng();
            onPick(next.lat, next.lng);
          },
        }}
      />
    </>
  );
};

const DEFAULT_POSITION: [number, number] = [10.0452, 105.7469];

export const PondModal: React.FC<PondModalProps> = ({
  isOpen,
  mode,
  formData,
  onChange,
  onSubmit,
  onClose,
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [resolution, setResolution] = useState<CoordinateResolution | null>(
    null
  );
  const [locationMessage, setLocationMessage] = useState("");

  const position = useMemo<[number, number]>(() => {
    const lat = Number(formData.vi_do);
    const lng = Number(formData.kinh_do);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }

    return DEFAULT_POSITION;
  }, [formData.vi_do, formData.kinh_do]);

  useEffect(() => {
    if (!isOpen) return;

    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const res = await locationService.getProvinces();
        setProvinces(res.data || []);
      } catch (error) {
        setLocationMessage("Khong tai duoc danh sach tinh/thanh.");
      } finally {
        setLoadingProvinces(false);
      }
    };

    void loadProvinces();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || mode !== "create" || formData.vi_do || formData.kinh_do) {
      return;
    }

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        onChange({
          ...formData,
          vi_do: lat,
          kinh_do: lng,
        });
        void resolveCoordinate(lat, lng);
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen || !formData.id_tinh_thanh) {
      setWards([]);
      return;
    }

    const loadWards = async () => {
      try {
        setLoadingWards(true);
        const res = await locationService.getWardsByProvince(
          formData.id_tinh_thanh as number | string
        );
        setWards(res.data || []);
      } catch (error) {
        setWards([]);
        setLocationMessage("Khong tai duoc danh sach xa/phuong.");
      } finally {
        setLoadingWards(false);
      }
    };

    void loadWards();
  }, [isOpen, formData.id_tinh_thanh]);

  const resolveCoordinate = async (lat: number, lng: number) => {
    try {
      const res = await locationService.resolveCoordinate({
        vi_do: lat,
        kinh_do: lng,
      });
      const data = res.data;
      setResolution(data);

      if (!data.tim_thay || !data.dia_gioi) {
        setLocationMessage(
          "Chua nhan dien duoc dia gioi diem nay. Don hang se duoc kiem tra theo ban kinh phuc vu."
        );
        return;
      }

      const selectedProvince = provinces.find(
        (item) => String(item.id_tinh_thanh) === String(formData.id_tinh_thanh)
      );

      if (
        selectedProvince &&
        String(selectedProvince.ma_tinh) !== String(data.dia_gioi.ma_tinh)
      ) {
        setLocationMessage(
          `Toa do thuoc ${data.dia_gioi.ten_tinh}, khac tinh/thanh da chon. He thong van co the phuc vu neu nam trong ban kinh cho phep.`
        );
        return;
      }

      setLocationMessage(
        `Da nhan dien: ${data.dia_gioi.ten_xa}, ${data.dia_gioi.ten_tinh}.`
      );
    } catch (error: any) {
      setLocationMessage(
        error?.response?.data?.message ||
          "Khong kiem tra duoc dia gioi toa do."
      );
    }
  };

  const handlePickCoordinate = (lat: number, lng: number) => {
    const nextLat = Number(lat.toFixed(6));
    const nextLng = Number(lng.toFixed(6));

    onChange({
      ...formData,
      vi_do: nextLat,
      kinh_do: nextLng,
    });

    void resolveCoordinate(nextLat, nextLng);
  };

  const handleProvinceChange = (value: string) => {
    onChange({
      ...formData,
      id_tinh_thanh: value ? Number(value) : null,
      id_phuong_xa: null,
    });
    setResolution(null);
    setLocationMessage("");
  };

  const handleWardChange = (value: string) => {
    const selectedWard = wards.find(
      (ward) => String(ward.id_phuong_xa) === String(value)
    );

    if (!selectedWard) {
      onChange({
        ...formData,
        id_phuong_xa: null,
      });
      return;
    }

    const lat = Number(selectedWard.vi_do_trung_tam);
    const lng = Number(selectedWard.kinh_do_trung_tam);

    const nextData: PondPayload = {
      ...formData,
      id_phuong_xa: selectedWard.id_phuong_xa,
    };

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      nextData.vi_do = lat;
      nextData.kinh_do = lng;
      void resolveCoordinate(lat, lng);
    }

    onChange(nextData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box pond-location-modal">
        <h3>{mode === "create" ? "Dang ky ao nuoi moi" : "Cap nhat thong tin ao"}</h3>
        <p className="modal-subtitle">
          Nhap thong tin ao va chon vi tri de he thong tinh phi van chuyen khi dat hang.
        </p>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Ten dinh danh ao *</label>
            <input
              type="text"
              required
              value={formData.ten_ao || ""}
              onChange={(e) => onChange({ ...formData, ten_ao: e.target.value })}
              placeholder="Vi du: Ao so 04 - Khu A"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Dien tich (m2) *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.dien_tich || ""}
                onChange={(e) =>
                  onChange({ ...formData, dien_tich: Number(e.target.value) })
                }
                placeholder="Vi du: 1200"
              />
            </div>

            <div className="form-group">
              <label>Loai hinh nuoi trong</label>
              <input
                type="text"
                value={formData.loai_hinh_nuoi || ""}
                onChange={(e) =>
                  onChange({ ...formData, loai_hinh_nuoi: e.target.value })
                }
                placeholder="Vi du: Tom the chan trang"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Dia chi cu the cua ao *</label>
            <input
              type="text"
              required
              value={formData.dia_chi_ao || ""}
              onChange={(e) =>
                onChange({ ...formData, dia_chi_ao: e.target.value })
              }
              placeholder="Vi du: ap 7, duong vao ao so 2..."
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Tinh/thanh</label>
              <select
                value={formData.id_tinh_thanh || ""}
                onChange={(e) => handleProvinceChange(e.target.value)}
                disabled={loadingProvinces}
              >
                <option value="">Chon tinh/thanh</option>
                {provinces.map((province) => (
                  <option
                    key={province.id_tinh_thanh}
                    value={province.id_tinh_thanh}
                  >
                    {province.ten_tinh}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Xa/phuong</label>
              <select
                value={formData.id_phuong_xa || ""}
                onChange={(e) => handleWardChange(e.target.value)}
                disabled={!formData.id_tinh_thanh || loadingWards}
              >
                <option value="">Chon xa/phuong</option>
                {wards.map((ward) => (
                  <option key={ward.id_phuong_xa} value={ward.id_phuong_xa}>
                    {ward.ten_xa}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Vi do</label>
              <input
                type="number"
                step="0.000001"
                value={formData.vi_do ?? ""}
                onChange={(e) =>
                  onChange({ ...formData, vi_do: e.target.value })
                }
                placeholder="Click tren ban do"
              />
            </div>

            <div className="form-group">
              <label>Kinh do</label>
              <input
                type="number"
                step="0.000001"
                value={formData.kinh_do ?? ""}
                onChange={(e) =>
                  onChange({ ...formData, kinh_do: e.target.value })
                }
                placeholder="Click tren ban do"
              />
            </div>
          </div>

          <div className="pond-map-box">
            <MapContainer center={position} zoom={11} scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <PondMap position={position} onPick={handlePickCoordinate} />
            </MapContainer>
          </div>

          {locationMessage && (
            <div className="pond-location-message">{locationMessage}</div>
          )}

          {resolution?.tim_thay && resolution.dia_gioi && (
            <div className="pond-location-result">
              {resolution.dia_gioi.ten_xa} - {resolution.dia_gioi.ten_tinh}
            </div>
          )}

          {mode === "edit" && (
            <div className="form-group">
              <label>Trang thai hoat dong</label>
              <select
                value={formData.trang_thai_ao || "dang_hoat_dong"}
                onChange={(e) =>
                  onChange({ ...formData, trang_thai_ao: e.target.value as any })
                }
              >
                <option value="dang_hoat_dong">Dang hoat dong san xuat</option>
                <option value="tam_ngung">Tam ngung / Dang xu ly ao</option>
              </select>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Huy bo
            </button>
            <button type="submit" className="btn-save">
              <i className="fa-solid fa-check"></i> Xac nhan luu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
