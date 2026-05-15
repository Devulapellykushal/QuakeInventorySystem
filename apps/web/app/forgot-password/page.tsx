"use client";

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
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export default function ForgotPasswordPage() {
  const { isLoading: authLoading } = useAuth();
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [devNote, setDevNote] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setDevNote(null);
    setIsSubmitting(true);
    try {
      const res = await authService.requestPasswordReset({ email });
      setSuccess(res.message);
      const note =
        (res as { devNote?: string }).devNote ??
        (res as { dev_note?: string }).dev_note;
      if (note) setDevNote(note);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) return <AuthPageLoader />;

  return (
    <div className="relative flex flex-1 min-h-dvh items-center justify-center px-4 py-12">
      <AuthShell
        title="Forgot password?"
        subtitle="Enter your account email and we will send reset instructions."
        footer={
          <p className="text-xs text-center text-[rgba(255,255,255,0.35)]">
            Remember your password?{" "}
            <Link href="/login" className="text-[#A5B4FC] hover:text-[#C7D2FE]">
              Sign in
            </Link>
          </p>
        }
      >
        {error ? <AuthErrorBanner message={error} /> : null}
        {success ? <AuthSuccessBanner message={success} /> : null}
        {devNote ? (
          <p className="text-xs text-[rgba(255,255,255,0.45)] mb-4 p-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]">
            {devNote}
          </p>
        ) : null}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthField label="Email">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(255,255,255,0.35)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={authInputClass}
                />
              </div>
            </AuthField>

            <button type="submit" disabled={isSubmitting} className={authSubmitClass}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        ) : null}
      </AuthShell>
    </div>
  );
}
