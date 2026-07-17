export const normalizeText = (value = "") =>
  String(value)
    .trim()
    .replace(/\s+/g, " ");

export const removeVietnameseTones = (value = "") =>
  normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeForCompare = (value = "") =>
  removeVietnameseTones(value)
    .toLowerCase()
    .replace(
      /^(tinh|thanh pho|tp\.?|quan|huyen|thi xa|xa|phuong|thi tran)\s+/i,
      ""
    )
    .trim();

export const cleanAdministrativeName = (value = "") =>
  normalizeText(value).replace(
    /^(Tỉnh|Thành phố|TP\.?|Quận|Huyện|Thị xã|Xã|Phường|Thị trấn)\s+/i,
    ""
  );

export const VIETNAM_PROVINCES_34 = [
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "Cần Thơ",
  "Đà Nẵng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Phòng",
  "Huế",
  "Hưng Yên",
  "Khánh Hòa",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "TP Hồ Chí Minh",
  "Tuyên Quang",
  "Vĩnh Long",
];

export const findProvinceInText = (
  value?: string | null,
  provinces = VIETNAM_PROVINCES_34
) => {
  const normalizedText = normalizeForCompare(value || "");
  if (!normalizedText) return "";

  return (
    provinces.find((province) => {
      const normalizedProvince = normalizeForCompare(province);
      return (
        normalizedText === normalizedProvince ||
        normalizedText.includes(normalizedProvince) ||
        normalizedProvince.includes(normalizedText)
      );
    }) || ""
  );
};

export const getLastAddressPart = (value?: string | null) => {
  const parts = String(value || "")
    .split(",")
    .map((part) => cleanAdministrativeName(part))
    .filter(Boolean);

  return parts[parts.length - 1] || "";
};
