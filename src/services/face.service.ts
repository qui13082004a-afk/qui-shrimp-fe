import axiosClient from "../lib/axios";

export const registerCCCD = async (
    idHoSo: number,
    cccdFront: File,
    cccdBack: File
) => {
    const formData = new FormData();
    formData.append("cccd_front", cccdFront);
    formData.append("cccd_back", cccdBack);

    const res = await axiosClient.post(
        `/faces/register/${idHoSo}`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return res.data;
};

export const verifyFace = async (
    idHoSo: number,
    selfie: File
) => {
    const formData = new FormData();
    formData.append("selfie", selfie);

    const res = await axiosClient.post(
        `/faces/verify/${idHoSo}`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return res.data;
};