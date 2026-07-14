import axiosClient from "../lib/axios";

export interface UploadedMedia {
  url: string;
  secure_url?: string;
  public_id?: string;
  resource_type?: string;
  original_filename?: string;
}

const getUploadedItem = (payload: any): UploadedMedia => {
  const item =
    payload?.data?.file ||
    payload?.data?.image ||
    payload?.data ||
    payload?.file ||
    payload?.image ||
    payload;

  if (typeof item === "string") {
    return {
      url: item,
      secure_url: item,
    };
  }

  const url =
    item?.secure_url ||
    item?.url ||
    item?.imageUrl ||
    item?.fileUrl ||
    item?.path ||
    item?.location ||
    "";

  if (!url) {
    throw new Error("Server không trả về URL ảnh sau khi tải lên");
  }

  return {
    ...item,
    url,
    secure_url: item?.secure_url || url,
  };
};

const getUploadedItems = (payload: any): UploadedMedia[] => {
  const items =
    payload?.data?.files ||
    payload?.data?.images ||
    payload?.data ||
    payload?.files ||
    payload?.images ||
    [];

  if (!Array.isArray(items)) {
    return [getUploadedItem(payload)];
  }

  return items.map((item) => {
    if (typeof item === "string") {
      return {
        url: item,
        secure_url: item,
      };
    }

    const url =
      item?.secure_url ||
      item?.url ||
      item?.imageUrl ||
      item?.fileUrl ||
      item?.path ||
      item?.location ||
      "";

    if (!url) {
      throw new Error("Có ảnh không nhận được URL từ server");
    }

    return {
      ...item,
      url,
      secure_url: item?.secure_url || url,
    };
  });
};

export const uploadService = {
  uploadSingle: async (file: File): Promise<UploadedMedia> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await axiosClient.post(
      "/upload/single",
      formData
    );

    return getUploadedItem(response.data);
  },

  uploadMultiple: async (
    files: File[]
  ): Promise<UploadedMedia[]> => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await axiosClient.post(
      "/upload/multiple",
      formData
    );

    return getUploadedItems(response.data);
  },

  uploadFile: async (file: File): Promise<UploadedMedia> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosClient.post(
      "/upload/file",
      formData
    );

    return getUploadedItem(response.data);
  },
};
