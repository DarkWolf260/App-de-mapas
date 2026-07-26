type ToastListener = (message: string, type: "error" | "success") => void;
let listener: ToastListener | null = null;

export function setToastListener(fn: ToastListener) {
  listener = fn;
}

export function showToast(message: string, type: "error" | "success" = "error") {
  listener?.(message, type);
}
