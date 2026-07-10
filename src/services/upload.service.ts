import axiosClient from "../lib/axios";

export const uploadService = {
  uploadSingle: async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await axiosClient.post("/upload/single", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },

  uploadMultiple: async (files: File[]) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("images", file);
    });

    const res = await axiosClient.post("/upload/multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
};