export type ToastType = "error" | "success" | "info";
type ToastListener = (message: string, type: ToastType) => void;
let listener: ToastListener | null = null;

export function setToastListener(fn: ToastListener) {
  listener = fn;
}

export function showToast(message: string, type: ToastType = "error") {
  listener?.(message, type);
}
