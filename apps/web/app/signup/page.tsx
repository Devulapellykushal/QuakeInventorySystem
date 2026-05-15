"use client";

// @maintained quake-inventory-system
import {
  AuthErrorBanner,
  AuthField,
  AuthPageLoader,
  AuthShell,
  authInputClass,
  authSubmitClass,
} from "@/components/auth/auth-shell";
import { useAuth } from "@/lib/auth";
import { useAuthStore } from "@/lib/auth/auth.store";
import { ADMIN_BASE } from "@/lib/admin-routes";
import { authService } from "@/lib/auth/auth.service";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Shield,
  UserCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

type SignupMode = "owner" | "staff";

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = (searchParams.get("invite") || "").trim();

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);

  const [mode, setMode] = React.useState<SignupMode>(
    inviteToken ? "staff" : "owner"
  );
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [businessName, setBusinessName] = React.useState("");
  const [adminEmail, setAdminEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [joinPreview, setJoinPreview] = React.useState<{
    found: boolean;
    organizationName: string | null;
    lockedEmail?: string | null;
    signupByAdminEmailAllowed: boolean;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  React.useEffect(() => {
    if (inviteToken) setMode("staff");
  }, [inviteToken]);

  React.useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push(ADMIN_BASE);
    }
  }, [isAuthenticated, authLoading, router]);

  React.useEffect(() => {
    if (joinPreview?.lockedEmail && !email) {
      setEmail(joinPreview.lockedEmail);
    }
  }, [joinPreview?.lockedEmail, email]);

  React.useEffect(() => {
    if (mode !== "staff") {
      setJoinPreview(null);
      return;
    }

    if (inviteToken) {
      const cancelled = { current: false };
      setPreviewLoading(true);
      authService
        .previewStaffJoin({ invite: inviteToken })
        .then((data) => {
          if (!cancelled.current) setJoinPreview(data);
        })
        .catch(() => {
          if (!cancelled.current) {
            setJoinPreview({
              found: false,
              organizationName: null,
              signupByAdminEmailAllowed: true,
            });
          }
        })
        .finally(() => {
          if (!cancelled.current) setPreviewLoading(false);
        });
      return () => {
        cancelled.current = true;
      };
    }

    const trimmed = adminEmail.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setJoinPreview(null);
      return;
    }

    const timer = window.setTimeout(() => {
      const cancelled = { current: false };
      setPreviewLoading(true);
      authService
        .previewStaffJoin({ adminEmail: trimmed })
        .then((data) => {
          if (!cancelled.current) setJoinPreview(data);
        })
        .catch(() => {
          if (!cancelled.current) {
            setJoinPreview({
              found: false,
              organizationName: null,
              signupByAdminEmailAllowed: true,
            });
          }
        })
        .finally(() => {
          if (!cancelled.current) setPreviewLoading(false);
        });
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [mode, adminEmail, inviteToken]);

  const staffNeedsAdminEmail =
    mode === "staff" && !inviteToken && joinPreview?.signupByAdminEmailAllowed !== false;

  const canSubmitStaff =
    mode !== "staff" ||
    inviteToken ||
    (staffNeedsAdminEmail && joinPreview?.found) ||
    (!staffNeedsAdminEmail && joinPreview?.found);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "staff" && !canSubmitStaff) {
      setError(
        inviteToken
          ? "This invite link is invalid or expired. Ask your administrator for a new link."
          : "Enter a valid owner email or use an invite link from your administrator."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response =
        mode === "owner"
          ? await authService.registerOwner({
              email,
              password,
              name,
              businessName,
            })
          : await authService.registerStaff({
              email,
              password,
              name,
              adminEmail: inviteToken ? undefined : adminEmail,
              inviteToken: inviteToken || undefined,
            });
      const u = response.user as {
        id: number;
        email: string;
        role: "ADMIN" | "STAFF";
        username?: string;
        firstName?: string;
        lastName?: string;
      };
      setUser({
        id: u.id,
        username: u.username ?? u.email.split("@")[0],
        email: u.email,
        firstName: u.firstName ?? "",
        lastName: u.lastName ?? "",
        role: u.role,
      });
      router.push(ADMIN_BASE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) return <AuthPageLoader />;

  const staffSubtitle = inviteToken
    ? "You were invited to join a team. Complete your account below."
    : joinPreview?.signupByAdminEmailAllowed === false
      ? "Use the invite link your administrator sent you."
      : "Join your team using your owner's admin email or an invite link.";

  return (
    <motion.div className="relative flex flex-1 min-h-dvh items-center justify-center px-4 py-12">
      <AuthShell
        title="Create your account"
        subtitle={
          mode === "owner"
            ? "Register your business and get admin access to your inventory."
            : staffSubtitle
        }
        footer={
          <p className="text-xs text-center text-[rgba(255,255,255,0.35)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#A5B4FC] hover:text-[#C7D2FE]">
              Sign in
            </Link>
          </p>
        }
      >
        {error ? <AuthErrorBanner message={error} /> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!inviteToken ? (
            <motion.div>
              <span className="block text-sm font-medium text-[rgba(255,255,255,0.5)] mb-2">
                I am
              </span>
              <motion.div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={() => setMode("owner")}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                    mode === "owner"
                      ? "bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/25"
                      : "text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.85)]"
                  }`}
                >
                  <Shield className="w-5 h-5" strokeWidth={1.75} />
                  Business owner
                </button>
                <button
                  type="button"
                  onClick={() => setMode("staff")}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                    mode === "staff"
                      ? "bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/25"
                      : "text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.85)]"
                  }`}
                >
                  <UserCircle className="w-5 h-5" strokeWidth={1.75} />
                  Staff member
                </button>
              </motion.div>
            </motion.div>
          ) : null}

          {mode === "owner" ? (
            <AuthField label="Business name">
              <motion.div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(255,255,255,0.35)]" />
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  placeholder="Ravi's Boutique"
                  className={authInputClass}
                />
              </motion.div>
            </AuthField>
          ) : (
            <>
              {inviteToken ? null : joinPreview?.signupByAdminEmailAllowed ===
                false ? (
                <p className="text-sm text-[rgba(255,255,255,0.55)] rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5">
                  Public staff signup by owner email is disabled. Ask your
                  administrator for an invite link.
                </p>
              ) : (
                <AuthField label="Owner / admin email">
                  <motion.div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(255,255,255,0.35)]" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required={staffNeedsAdminEmail}
                      placeholder="owner@yourbusiness.com"
                      className={authInputClass}
                    />
                  </motion.div>
                  <p className="text-xs text-[rgba(255,255,255,0.35)] mt-1.5">
                    Must match the email your owner used when they registered.
                  </p>
                </AuthField>
              )}

              <StaffJoinBanner loading={previewLoading} preview={joinPreview} />
            </>
          )}

          <AuthField label="Your name (optional)">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#F5F0E8] placeholder:text-[rgba(255,255,255,0.35)] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            />
          </AuthField>

          <AuthField label="Your email">
            <motion.div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(255,255,255,0.35)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                readOnly={Boolean(joinPreview?.lockedEmail)}
                className={authInputClass}
              />
            </motion.div>
          </AuthField>

          <AuthField label="Password">
            <motion.div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(255,255,255,0.35)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className={authInputClass}
              />
            </motion.div>
          </AuthField>

          <button
            type="submit"
            disabled={isSubmitting || (mode === "staff" && !canSubmitStaff)}
            className={authSubmitClass}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>
      </AuthShell>
    </motion.div>
  );
}

function StaffJoinBanner({
  loading,
  preview,
}: {
  loading: boolean;
  preview: {
    found: boolean;
    organizationName: string | null;
    lockedEmail?: string | null;
  } | null;
}) {
  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.45)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        Looking up business…
      </p>
    );
  }

  if (!preview) return null;

  if (preview.found && preview.organizationName) {
    return (
      <p className="flex items-start gap-2 text-sm text-emerald-300/90 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5">
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Joining: <strong className="font-semibold">{preview.organizationName}</strong>
          {preview.lockedEmail ? (
            <span className="block text-xs text-emerald-200/70 mt-1">
              Invite is for {preview.lockedEmail}
            </span>
          ) : null}
        </span>
      </p>
    );
  }

  if (preview.organizationName === null && preview.found === false) {
    return (
      <p className="text-sm text-amber-300/90 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5">
        No business found for that email. Check the address or ask your owner for
        an invite link.
      </p>
    );
  }

  return null;
}

export default function SignupPage() {
  return (
    <React.Suspense fallback={<AuthPageLoader />}>
      <SignupPageContent />
    </React.Suspense>
  );
}
