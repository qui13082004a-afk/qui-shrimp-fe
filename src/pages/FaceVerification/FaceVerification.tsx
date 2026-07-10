import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Webcam from "react-webcam";
import { registerCCCD, verifyFace } from "../../services/face.service";
import "./FaceVerification.css";

const FaceVerification = () => {
    const { idHoSo } = useParams();
    const navigate = useNavigate();

    const webcamRef = useRef<Webcam>(null);

    const [step, setStep] = useState(1);

    const [cccdFront, setCccdFront] = useState<File | null>(null);
    const [cccdBack, setCccdBack] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null);

    const [frontPreview, setFrontPreview] = useState("");
    const [backPreview, setBackPreview] = useState("");
    const [selfiePreview, setSelfiePreview] = useState("");

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleChooseCCCD = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "front" | "back"
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const preview = URL.createObjectURL(file);

        if (type === "front") {
            setCccdFront(file);
            setFrontPreview(preview);
        } else {
            setCccdBack(file);
            setBackPreview(preview);
        }
    };

    const dataURLtoFile = (dataUrl: string, filename: string) => {
        const arr = dataUrl.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
        const bstr = atob(arr[1]);

        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, { type: mime });
    };

    const handleCaptureSelfie = () => {
        const imageSrc = webcamRef.current?.getScreenshot();

        if (!imageSrc) {
            alert("Không chụp được ảnh. Vui lòng kiểm tra camera.");
            return;
        }

        const file = dataURLtoFile(imageSrc, "selfie.png");

        setSelfie(file);
        setSelfiePreview(imageSrc);
    };

    const handleRetakeSelfie = () => {
        setSelfie(null);
        setSelfiePreview("");
        setResult(null);
        setStep(2);
    };

    const handleSubmitCCCD = async () => {
        if (!idHoSo) {
            alert("Không tìm thấy mã hồ sơ.");
            return;
        }

        if (!cccdFront || !cccdBack) {
            alert("Vui lòng chọn đủ mặt trước và mặt sau CCCD.");
            return;
        }

        try {
            setLoading(true);

            await registerCCCD(Number(idHoSo), cccdFront, cccdBack);

            setStep(2);
        } catch (error: any) {
            alert(error.response?.data?.message || "Upload CCCD thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyFace = async () => {
        if (!idHoSo) {
            alert("Không tìm thấy mã hồ sơ.");
            return;
        }

        if (!selfie) {
            alert("Vui lòng chụp ảnh selfie.");
            return;
        }

        try {
            setLoading(true);

            const res = await verifyFace(Number(idHoSo), selfie);
            const verifyData = res.data;

            setResult(verifyData);
            setStep(3);

            if (verifyData?.verified === true) {
                setTimeout(() => {
                    navigate("/ponds");
                }, 2500);
            }
        } catch (error: any) {
            alert(
                error.response?.data?.message ||
                    "Có lỗi xảy ra khi xác thực khuôn mặt."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="face-page">
            <div className="face-card">
                <h2>Xác thực CCCD và khuôn mặt</h2>

                <div className="step-bar">
                    <div className={step >= 1 ? "step active" : "step"}>1</div>
                    <div className="line"></div>
                    <div className={step >= 2 ? "step active" : "step"}>2</div>
                    <div className="line"></div>
                    <div className={step >= 3 ? "step active" : "step"}>3</div>
                </div>

                {step === 1 && (
                    <div className="step-content">
                        <h3>Bước 1/2</h3>
                        <p>Upload CCCD</p>

                        <div className="upload-grid">
                            <label className="upload-box">
                                <span>Mặt trước</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleChooseCCCD(e, "front")}
                                />

                                {frontPreview ? (
                                    <img src={frontPreview} alt="CCCD mặt trước" />
                                ) : (
                                    <div className="placeholder">+</div>
                                )}
                            </label>

                            <label className="upload-box">
                                <span>Mặt sau</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleChooseCCCD(e, "back")}
                                />

                                {backPreview ? (
                                    <img src={backPreview} alt="CCCD mặt sau" />
                                ) : (
                                    <div className="placeholder">+</div>
                                )}
                            </label>
                        </div>

                        <button onClick={handleSubmitCCCD} disabled={loading}>
                            {loading ? "Đang gửi..." : "Tiếp tục"}
                        </button>
                    </div>
                )}

                {step === 2 && (
    <div className="step-content">
        <h3>Bước 2/2</h3>
        <p>Xác thực khuôn mặt</p>

        <div className="ekyc-camera-wrapper">
            <div className="face-guide">
                <div className="face-oval"></div>

                {selfiePreview ? (
                    <img src={selfiePreview} alt="Selfie" className="selfie-preview" />
                ) : (
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/png"
                        videoConstraints={{
                            facingMode: "user",
                        }}
                        className="webcam"
                    />
                )}
            </div>
        </div>

        <p className="camera-note">
            Vui lòng đặt khuôn mặt vào giữa khung, không che mặt và nhìn thẳng camera.
        </p>

        <div className="button-group">
            {!selfiePreview ? (
                <button type="button" onClick={handleCaptureSelfie}>
                    Chụp ảnh
                </button>
            ) : (
                <button
                    type="button"
                    className="outline-btn"
                    onClick={handleRetakeSelfie}
                >
                    Chụp lại
                </button>
            )}

            <button
                onClick={handleVerifyFace}
                disabled={loading || !selfie}
            >
                {loading ? "Đang xác thực..." : "Xác thực"}
            </button>
        </div>
    </div>
)}
                {step === 3 && result && (
                    <div className="success-box">
                        <div
                            className="success-icon"
                            style={{
                                background: result.verified ? "#22c55e" : "#ef4444",
                            }}
                        >
                            {result.verified ? "✔" : "✖"}
                        </div>

                        <h3
                            style={{
                                color: result.verified ? "#22c55e" : "#ef4444",
                            }}
                        >
                            {result.verified
                                ? "Xác thực thành công"
                                : "Xác thực thất bại"}
                        </h3>

                        <p>
                            Độ giống: <strong>{result?.similarity ?? 0}%</strong>
                        </p>

                        <span>
                            {result.verified
                                ? "Trạng thái: Đã xác thực"
                                : "Khuôn mặt không khớp với CCCD"}
                        </span>

                        {result.verified ? (
                            <>
                                <div className="redirect-spinner"></div>
                                <p
                                    style={{
                                        marginTop: 12,
                                        color: "#64748b",
                                        fontSize: 15,
                                    }}
                                >
                                    Đang chuyển về trang Ao nuôi...
                                </p>
                            </>
                        ) : (
                            <div className="button-group" style={{ marginTop: 25 }}>
                                <button type="button" onClick={handleRetakeSelfie}>
                                    Xác thực lại
                                </button>

                                <button
                                    type="button"
                                    className="outline-btn"
                                    onClick={() => navigate(-1)}
                                >
                                    Quay lại
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FaceVerification;