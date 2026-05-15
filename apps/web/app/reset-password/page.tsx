"use client";

// @maintained quake-inventory-system
import {
  AuthErrorBanner,
  AuthField,
  AuthPageLoader,
  AuthShell,
  AuthSuccessBanner,
  authInputClass,
  authSubmitClass,
} from "@/components/auth/auth-shell";
import { useAuth } from "@/lib/auth";
import { authService } from "@/lib/auth/auth.service";
import { Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Suspense } from "react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!uid || !token) {
      setError("Invalid reset link. Request a new one from the forgot password page.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await authService.confirmPasswordReset({
        uid,
        token,
        newPassword: password,
      });
      setSuccess(res.message);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex flex-1 min-h-dvh items-center justify-center px-4 py-12">
      <AuthShell
        title="Set a new password"
        subtitle="Choose a strong password you have not used here before."
        footer={
          <p className="text-xs text-center text-[rgba(255,255,255,0.35)]">
            <Link href="/login" className="text-[#A5B4FC] hover:text-[#C7D2FE]">
              Back to sign in
            </Link>
          </p>
        }
      >
        {error ? <AuthErrorBanner message={error} /> : null}
        {success ? <AuthSuccessBanner message={success} /> : null}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthField label="New password">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(255,255,255,0.35)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={authInputClass}
                />
              </div>
            </AuthField>

            <AuthField label="Confirm password">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(255,255,255,0.35)]" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={authInputClass}
                />
              </div>
            </AuthField>

            <button type="submit" disabled={isSubmitting} className={authSubmitClass}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update password"
              )}
            </button>
          </form>
        ) : null}
      </AuthShell>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { isLoading: authLoading } = useAuth();
  if (authLoading) return <AuthPageLoader />;
  return (
    <Suspense fallback={<AuthPageLoader />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
