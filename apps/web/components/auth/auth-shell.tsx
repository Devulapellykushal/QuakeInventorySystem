"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  backHref = "/login",
  backLabel = "Back to sign in",
}: AuthShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md relative z-10"
    >
      <motion.div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-[rgba(99,102,241,0.15)] bg-[rgba(0,0,0,0.2)] p-2 sm:h-[5.25rem] sm:w-[5.25rem]"
        >
          <Image
            src="/assets/2d/aio.png"
            alt="Quake"
            width={168}
            height={168}
            className="h-full w-full object-contain drop-shadow-md"
            priority
          />
        </motion.div>
        <h1 className="text-3xl font-bold text-[#F5F0E8]">Quake</h1>
        <p className="text-sm mt-1 text-[rgba(255,255,255,0.35)]">
          Inventory Management System
        </p>
      </motion.div>

      <motion.div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.015)] backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6"
        >
          <h2 className="text-xl font-semibold text-[rgba(255,255,255,0.85)]">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-[rgba(255,255,255,0.45)] mt-1 mb-6">{subtitle}</p>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="h-4 mb-4"
            />
          )}
          {children}
        </motion.div>
        {footer ? (
          <motion.div className="px-6 py-4 bg-[rgba(255,255,255,0.04)] border-t border-[rgba(255,255,255,0.06)]">
            {footer}
          </motion.div>
        ) : null}
      </motion.div>

      <p className="mt-6 text-center">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-[rgba(255,255,255,0.45)] hover:text-[#F5F0E8] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </p>
    </motion.div>
  );
}

export function AuthField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <motion.div>
      <label className="block text-sm font-medium text-[rgba(255,255,255,0.5)] mb-1.5">
        {label}
      </label>
      {children}
    </motion.div>
  );
}

export const authInputClass =
  "w-full pl-10 pr-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#F5F0E8] placeholder:text-[rgba(255,255,255,0.35)] focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all";

export const authSubmitClass =
  "w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[#FFFFFF] font-semibold transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed [background:linear-gradient(135deg,#6366F1,#A855F7,#EC4899)]";

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-3 mb-4 rounded-lg bg-[rgba(236,72,153,0.15)] border border-[rgba(236,72,153,0.3)]"
    >
      <p className="text-sm text-[#EC4899]">{message}</p>
    </motion.div>
  );
}

export function AuthSuccessBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-3 mb-4 rounded-lg bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.35)]"
    >
      <p className="text-sm text-[#86EFAC]">{message}</p>
    </motion.div>
  );
}

export function AuthPageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-1 min-h-dvh items-center justify-center bg-[#111111]"
    >
      <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
    </motion.div>
  );
}
