import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "/fonts/RobotoCondensed-Regular.ttf",
      fontWeight: "normal",
    },
    {
      src: "/fonts/Roboto-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

const POSTPAID_SURCHARGE_RATE = 5;
const OVERDUE_INTEREST_RATE_MONTHLY = 1.2;

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 11,
    lineHeight: 1.45,
    fontFamily: "Roboto",
  },
  center: {
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 14,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 16,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  row: {
    marginBottom: 3,
  },
  bold: {
    fontWeight: "bold",
  },
  clause: {
    marginBottom: 5,
    textAlign: "justify",
  },
  signatureWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
  },
  signatureBox: {
    width: "45%",
    textAlign: "center",
  },
  signatureSpace: {
    height: 68,
  },
});

export interface ContractPdfProfile {
  id_ho_so?: number;
  dinh_muc_cong_no?: number | string;
  han_thanh_toan?: string | null;
  ghi_chu?: string | null;
  NguoiDung?: {
    ho_ten?: string;
    email?: string;
    so_dien_thoai?: string;
    dia_chi?: string;
  };
  AoNuoi?: {
    ten_ao?: string;
    dien_tich?: number | string;
    dia_chi_ao?: string;
  };
  VuNuoi?: {
    ten_vu_nuoi?: string;
    ngay_tha_giong?: string;
    ngay_thu_hoach_du_kien?: string;
  };
  ChinhSachHanMuc?: {
    ten_chinh_sach?: string;
    giai_doan?: string;
    tu_ngay?: number | string;
    den_ngay?: number | string;
    han_muc_toi_da?: number | string;
    ghi_chu?: string | null;
  } | null;
}

interface Props {
  profile: ContractPdfProfile;
  contractCode: string;
  extraTerms?: string;
}

const formatCurrency = (value?: number | string | null) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatDate = (value?: string | null) => {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleDateString("vi-VN");
};

const formatPolicyStage = (value?: string | null) => {
  const stageMap: Record<string, string> = {
    giai_doan_1: "Giai đoạn 1",
    giai_doan_2: "Giai đoạn 2",
    giai_doan_3: "Giai đoạn 3",
    giai_doan_4: "Giai đoạn 4",
  };

  return value ? stageMap[value] || value : "Chưa có";
};

export default function ContractPdfDocument({
  profile,
  contractCode,
  extraTerms,
}: Props) {
  const policy = profile.ChinhSachHanMuc;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.center}>CÔNG TY VẬT TƯ NUÔI TÔM LVTN</Text>
        <Text style={styles.center}>Độc lập - Tự do - Hạnh phúc</Text>

        <Text style={styles.title}>Hợp đồng mua vật tư trả sau</Text>
        <Text style={styles.subtitle}>
          Số hợp đồng: {contractCode} | Hồ sơ mua trả sau #{profile.id_ho_so}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Thông tin các bên</Text>
          <Text style={styles.row}>
            Bên A: Công ty vật tư nuôi tôm LVTN
          </Text>
          <Text style={styles.row}>
            Địa chỉ: ............................................................
          </Text>
          <Text style={styles.row}>
            Đại diện: ..........................................................
          </Text>
          <Text style={styles.row}>
            Bên B: {profile.NguoiDung?.ho_ten || "Chưa có thông tin"}
          </Text>
          <Text style={styles.row}>
            Số điện thoại: {profile.NguoiDung?.so_dien_thoai || "Chưa có"}
          </Text>
          <Text style={styles.row}>
            Email: {profile.NguoiDung?.email || "Chưa có"}
          </Text>
          <Text style={styles.row}>
            Địa chỉ: {profile.NguoiDung?.dia_chi || "Chưa có"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Căn cứ cấp quyền mua trả sau</Text>
          <Text style={styles.row}>
            Ao nuôi: {profile.AoNuoi?.ten_ao || "Chưa có"}
          </Text>
          <Text style={styles.row}>
            Diện tích ao: {profile.AoNuoi?.dien_tich || "Chưa có"}
          </Text>
          <Text style={styles.row}>
            Địa chỉ ao: {profile.AoNuoi?.dia_chi_ao || "Chưa có"}
          </Text>
          <Text style={styles.row}>
            Vụ nuôi: {profile.VuNuoi?.ten_vu_nuoi || "Chưa có"}
          </Text>
          <Text style={styles.row}>
            Ngày thả giống: {formatDate(profile.VuNuoi?.ngay_tha_giong)}
          </Text>
          <Text style={styles.row}>
            Ngày thu hoạch dự kiến:{" "}
            {formatDate(profile.VuNuoi?.ngay_thu_hoach_du_kien)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Hạn mức và chính sách áp dụng</Text>
          <Text style={styles.row}>
            Hạn mức công nợ được duyệt:{" "}
            {formatCurrency(profile.dinh_muc_cong_no)}
          </Text>
          <Text style={styles.row}>
            Hạn thanh toán: {formatDate(profile.han_thanh_toan)}
          </Text>
          <Text style={styles.row}>
            Chính sách hạn mức: {policy?.ten_chinh_sach || "Chưa có chính sách"}
          </Text>
          <Text style={styles.row}>
            Giai đoạn áp dụng: {formatPolicyStage(policy?.giai_doan)}
            {policy?.tu_ngay || policy?.den_ngay
              ? ` (${policy?.tu_ngay || 0} - ${
                  policy?.den_ngay || 0
                } ngày nuôi)`
              : ""}
          </Text>
          <Text style={styles.row}>
            Hạn mức tối đa theo chính sách:{" "}
            {formatCurrency(policy?.han_muc_toi_da)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Giá bán, phụ phí và lãi quá hạn</Text>
          <Text style={styles.clause}>
            Các đơn hàng phát sinh theo hình thức mua trả sau được tính theo giá
            bán trả sau của hệ thống. Giá bán trả sau có thể cao hơn giá thanh
            toán trực tiếp với tỷ lệ phụ phí hiện hành là {POSTPAID_SURCHARGE_RATE}%.
          </Text>
          <Text style={styles.clause}>
            Trường hợp Bên B thanh toán sau hạn thanh toán đã được phê duyệt,
            hệ thống tạm tính lãi quá hạn theo tỷ lệ{" "}
            {OVERDUE_INTEREST_RATE_MONTHLY}%/tháng trên phần công nợ gốc còn
            lại. Lãi quá hạn được tính theo từng tháng phát sinh quá hạn cho
            đến khi Bên B hoàn tất nghĩa vụ thanh toán.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Quyền và nghĩa vụ của Bên B</Text>
          <Text style={styles.clause}>
            Bên B chỉ được mua vật tư trả sau trong phạm vi hạn mức đã được Bên
            A phê duyệt và chỉ áp dụng cho hồ sơ, ao nuôi, vụ nuôi nêu trong
            hợp đồng này.
          </Text>
          <Text style={styles.clause}>
            Bên B có trách nhiệm cung cấp thông tin trung thực, sử dụng vật tư
            đúng mục đích sản xuất, theo dõi công nợ trên hệ thống và thanh toán
            đầy đủ các khoản nợ phát sinh đúng hạn.
          </Text>
          <Text style={styles.clause}>
            Bên B phải phối hợp với Bên A, nhân viên thẩm định hoặc nhân viên
            giao hàng trong quá trình xác minh hồ sơ, giao nhận vật tư, đối
            chiếu hợp đồng và xử lý công nợ.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Quyền và nghĩa vụ của Bên A</Text>
          <Text style={styles.clause}>
            Bên A cung cấp vật tư theo đơn hàng được xác nhận trên hệ thống,
            theo dõi hạn mức, công nợ, lịch sử thanh toán và hỗ trợ Bên B tra
            cứu thông tin liên quan đến hồ sơ mua trả sau.
          </Text>
          <Text style={styles.clause}>
            Bên A có quyền tạm dừng hoặc khóa quyền mua trả sau khi Bên B quá
            hạn thanh toán, cung cấp thông tin sai lệch, vượt hạn mức được duyệt
            hoặc có dấu hiệu rủi ro trong quá trình sử dụng hạn mức.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Thanh toán và xử lý vi phạm</Text>
          <Text style={styles.clause}>
            Các khoản công nợ phát sinh được ghi nhận theo từng đơn hàng trả sau
            đã hoàn tất. Bên B có thể thanh toán một phần hoặc toàn bộ công nợ
            theo quy định của hệ thống.
          </Text>
          <Text style={styles.clause}>
            Nếu Bên B không thanh toán đúng hạn, Bên A có quyền gửi thông báo
            nhắc nợ, áp dụng lãi quá hạn, tạm giữ hoặc khóa hạn mức, từ chối đơn
            trả sau mới và thực hiện các biện pháp thu hồi công nợ phù hợp.
          </Text>
        </View>

        {extraTerms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Điều khoản bổ sung</Text>
            <Text style={styles.clause}>{extraTerms}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Hiệu lực hợp đồng</Text>
          <Text style={styles.clause}>
            Hợp đồng có hiệu lực kể từ ngày hai bên ký xác nhận. Hợp đồng là căn
            cứ để hệ thống kích hoạt, theo dõi và quản lý các giao dịch mua vật
            tư trả sau của Bên B trong phạm vi hạn mức được duyệt.
          </Text>
        </View>

        <View style={styles.signatureWrap}>
          <View style={styles.signatureBox}>
            <Text style={styles.bold}>ĐẠI DIỆN BÊN A</Text>
            <Text>(Ký và ghi rõ họ tên)</Text>
            <View style={styles.signatureSpace} />
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.bold}>ĐẠI DIỆN BÊN B</Text>
            <Text>(Ký và ghi rõ họ tên)</Text>
            <View style={styles.signatureSpace} />
          </View>
        </View>
      </Page>
    </Document>
  );
}
