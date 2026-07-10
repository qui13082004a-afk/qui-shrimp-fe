import Swal from "sweetalert2";

export const toastSuccess = (message: string) => {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: message,
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
  });
};

export const toastError = (message: string) => {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "error",
    title: message,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
  });
};

export const toastWarning = (message: string) => {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "warning",
    title: message,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
  });
};

export const confirmDialog = async (
  title: string,
  text = "Bạn có chắc muốn thực hiện thao tác này?"
) => {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Đồng ý",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#004077",
    cancelButtonColor: "#64748b",
  });

  return result.isConfirmed;
};

export const showLoading = (title = "Đang xử lý...") => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const closeLoading = () => {
  Swal.close();
};