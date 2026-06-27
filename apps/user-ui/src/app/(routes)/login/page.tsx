// Theme: Archway — Login page; split editorial + form layout, mono credential details, warm off-white canvas

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  email: string;
  password: string;
};

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="13"
    height="13"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ─── Google SVG logo (official safe-to-use path) ─────────────────────────────

const GoogleLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden="true"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// ─── Editorial panel stat rows (signature element: mono type for commerce data) ──

type StatRowProps = {
  label: string;
  value: string;
};

const StatRow = ({ label, value }: StatRowProps) => (
  <div className="flex items-baseline justify-between py-3 border-b border-white/10">
    <span className="text-[13px] text-white/50">{label}</span>
    <span className="font-mono text-[13px] font-medium text-white/90 tracking-tight">
      {value}
    </span>
  </div>
);

// ─── Google sign-in button ────────────────────────────────────────────────────

type GoogleButtonProps = {
  onClick?: () => void;
};

const GoogleButton = ({ onClick }: GoogleButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="
      w-full flex items-center justify-center gap-3
      h-10 px-4
      bg-white border border-[#E4E2DE] rounded-[4px]
      text-[13px] font-medium text-[#111110]
      hover:bg-[#F7F6F4] transition-colors
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/20
    "
  >
    <GoogleLogo />
    Sign in with Google
  </button>
);

// ─── Form field wrapper ───────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

const Field = ({ label, error, children }: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[13px] font-medium text-[#111110]">{label}</label>
    {children}
    {error && (
      <p className="text-[12px] text-[#D92D20] leading-snug" role="alert">
        {error}
      </p>
    )}
  </div>
);

// ─── Login page ───────────────────────────────────────────────────────────────

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError]         = useState<string | null>(null);
  const [rememberMe, setRememberMe]           = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    setServerError(null);
    // TODO: connect to auth API
    console.log(data);
  };

  return (
    <main className="min-h-screen bg-[#F7F6F4]">

      {/* ── Breadcrumb ── */}
      <div className="max-w-[1320px] mx-auto px-4 md:px-6 pt-5 pb-0">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-[12px] text-[#787672]"
        >
          <Link href="/" className="hover:text-[#111110] transition-colors">
            Home
          </Link>
          <ChevronRightIcon />
          <span className="text-[#111110]">Login</span>
        </nav>
      </div>

      {/* ── Split layout ── */}
      <div className="max-w-[1320px] mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* ── Left: editorial panel ── */}
          <div className="hidden lg:flex flex-col justify-between bg-[#111110] rounded-[6px] p-10 min-h-[560px]">

            {/* Wordmark */}
            <div>
              <span className="font-['DM_Serif_Display'] text-[28px] text-white leading-none tracking-[-0.01em]">
                Eshop
              </span>
              <p className="mt-3 text-[15px] text-white/50 leading-relaxed max-w-xs">
                India's multi-vendor marketplace. Every product, every seller,
                one address.
              </p>
            </div>

            {/* Stat rows — signature element: mono type for commerce data */}
            <div className="mt-10">
              <p className="text-[11px] font-medium text-white/30 uppercase tracking-widest mb-2">
                Platform at a glance
              </p>
              <StatRow label="Active vendors"     value="12,400+"    />
              <StatRow label="Products listed"    value="8,30,000+"  />
              <StatRow label="Orders fulfilled"   value="₹94 Cr+"    />
              <StatRow label="Avg. delivery time" value="2.4 days"   />
              <StatRow label="Seller rating"      value="4.7 / 5.0"  />
            </div>

            {/* Footer note */}
            <p className="mt-10 text-[11px] text-white/25 leading-relaxed">
              Secured by 256-bit TLS encryption. Your data is never sold.
            </p>
          </div>

          {/* ── Right: form card ── */}
          <div className="bg-white border border-[#E4E2DE] rounded-[6px] p-7 md:p-9 w-full">

            {/* Heading */}
            <div className="mb-6">
              <h1 className="font-['DM_Serif_Display'] text-[26px] text-[#111110] leading-tight">
                Sign in to Eshop
              </h1>
              <p className="mt-1.5 text-[13px] text-[#787672]">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-[#111110] font-medium underline underline-offset-2 hover:no-underline transition-all"
                >
                  Create one free
                </Link>
              </p>
            </div>

            {/* Google */}
            <GoogleButton />

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#E4E2DE]" />
              <span className="text-[12px] text-[#787672] whitespace-nowrap">
                or continue with email
              </span>
              <div className="flex-1 h-px bg-[#E4E2DE]" />
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex flex-col gap-4"
            >
              {/* Email */}
              <Field label="Email address" error={errors.email?.message}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  className={`
                    w-full h-10 px-3.5
                    text-[14px] text-[#111110] placeholder:text-[#787672]
                    bg-[#F7F6F4] border rounded-[4px]
                    outline-none transition-colors
                    focus:bg-white focus:border-[#1A1A1A]
                    ${errors.email
                      ? "border-[#D92D20] bg-white"
                      : "border-[#E4E2DE]"
                    }
                  `}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Enter a valid email address",
                    },
                  })}
                />
              </Field>

              {/* Password */}
              <Field label="Password" error={errors.password?.message}>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    className={`
                      w-full h-10 pl-3.5 pr-10
                      text-[14px] text-[#111110] placeholder:text-[#787672]
                      bg-[#F7F6F4] border rounded-[4px]
                      outline-none transition-colors
                      focus:bg-white focus:border-[#1A1A1A]
                      ${errors.password
                        ? "border-[#D92D20] bg-white"
                        : "border-[#E4E2DE]"
                      }
                    `}
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((v) => !v)}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    className="
                      absolute right-3 top-1/2 -translate-y-1/2
                      text-[#787672] hover:text-[#111110] transition-colors
                    "
                  >
                    {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </Field>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between mt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  {/* Custom checkbox */}
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={rememberMe}
                      onChange={() => setRememberMe((v) => !v)}
                      id="remember-me"
                    />
                    <div
                      className="
                        w-4 h-4 rounded-[3px] border border-[#E4E2DE]
                        bg-[#F7F6F4]
                        peer-checked:bg-[#1A1A1A] peer-checked:border-[#1A1A1A]
                        peer-focus-visible:ring-2 peer-focus-visible:ring-[#1A1A1A]/20
                        transition-colors flex items-center justify-center
                      "
                      aria-hidden="true"
                    >
                      {rememberMe && (
                        <svg
                          viewBox="0 0 10 8"
                          width="10"
                          height="8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M1 4l2.5 2.5L9 1"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-[13px] text-[#787672]">
                    Remember me
                  </span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-[13px] text-[#787672] hover:text-[#111110] transition-colors underline underline-offset-2 hover:no-underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Server error */}
              {serverError && (
                <div
                  className="px-3.5 py-2.5 bg-[#FEF3F2] border border-[#FECDCA] rounded-[4px]"
                  role="alert"
                >
                  <p className="text-[13px] text-[#D92D20]">{serverError}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  mt-1 w-full h-10
                  bg-[#1A1A1A] text-white
                  text-[14px] font-medium
                  rounded-[4px] 
                  hover:bg-[#2d2d2d] active:bg-[#111110]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/30
                "
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            </form>

            {/* Terms */}
            <p className="mt-5 text-[11px] text-[#787672] text-center leading-relaxed">
              By signing in you agree to our{" "}
              <Link
                href="/terms"
                className="underline underline-offset-2 hover:text-[#111110] transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-[#111110] transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;