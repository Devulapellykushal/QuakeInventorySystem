import axios from "axios";

/** Extract a user-facing message from Quake API error responses. */
export function formatApiError(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as Record<string, unknown> | undefined;
    if (!d) return err.message || fallback;

    const wrapped = d.error;
    if (wrapped && typeof wrapped === "object" && wrapped !== null) {
      const msg = (wrapped as Record<string, unknown>).message;
      if (typeof msg === "string" && msg.trim()) return msg;
    }

    if (typeof d.detail === "string") return d.detail;
    const nfe = d.non_field_errors ?? d.nonFieldErrors;
    if (Array.isArray(nfe) && nfe[0]) return String(nfe[0]);
    if (typeof d.message === "string") return d.message;

    for (const key of Object.keys(d)) {
      const val = d[key];
      if (Array.isArray(val) && val[0]) return String(val[0]);
      if (typeof val === "string") return val;
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
