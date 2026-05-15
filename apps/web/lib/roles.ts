import { ADMIN_BASE, adminHref } from "@/lib/admin-routes";

export type AppRole = "ADMIN" | "STAFF";

export const STAFF_HOME = "/pos";
export const ADMIN_HOME = ADMIN_BASE;

/** Where staff land after sign-in or when blocked from admin-only areas. */
export function getDefaultHomeForRole(
  role: AppRole | null | undefined,
): string {
  return role === "STAFF" ? STAFF_HOME : ADMIN_HOME;
}

/** Back-office link from POS header for staff (not the owner dashboard). */
export function getStaffBackOfficeHref(): string {
  return adminHref("/invoices");
}

const STAFF_ALLOWED_PATH_PREFIXES = [
  STAFF_HOME,
  adminHref("/inventory"),
  adminHref("/invoices"),
  adminHref("/customers"),
  adminHref("/settings"),
] as const;

function isStaffAllowedPath(pathOnly: string): boolean {
  return STAFF_ALLOWED_PATH_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`),
  );
}

/**
 * Resolve post-login redirect from `next` query param with role-aware defaults.
 * Staff default to POS; administrators default to the owner dashboard.
 */
export function resolvePostLoginPath(
  role: AppRole | null | undefined,
  nextParam: string | null,
): string {
  const defaultHome = getDefaultHomeForRole(role);

  if (nextParam == null || nextParam === "") return defaultHome;

  let decoded: string;
  try {
    decoded = decodeURIComponent(nextParam.trim());
  } catch {
    return defaultHome;
  }

  const pathOnly = decoded.split("?")[0].split("#")[0];
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//")) return defaultHome;

  if (role === "STAFF") {
    return isStaffAllowedPath(pathOnly) ? decoded : defaultHome;
  }

  if (
    pathOnly === ADMIN_HOME ||
    pathOnly.startsWith(`${ADMIN_HOME}/`) ||
    pathOnly === STAFF_HOME ||
    pathOnly.startsWith(`${STAFF_HOME}/`)
  ) {
    return decoded;
  }

  return defaultHome;
}
