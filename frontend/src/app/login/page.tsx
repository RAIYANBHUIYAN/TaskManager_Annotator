"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";

import PasswordInput from "@/components/shared/PasswordInput";
import { requestLoginOtp, resendLoginOtp, verifyLoginOtp } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d{6}$/, "Code must be 6 digits"),
});

type LoginForm = z.infer<typeof loginSchema>;
type OtpForm = z.infer<typeof otpSchema>;

function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    if (typeof data.detail === "string") return data.detail;
  }
  return fallback;
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onCredentialsSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      const challenge = await requestLoginOtp(data.email, data.password);
      setChallengeToken(challenge.challenge_token);
      setMaskedEmail(challenge.email);
      setStep("otp");
      otpForm.reset({ otp: "" });
      toast.success("Verification code sent to your email");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOtpSubmit = async (data: OtpForm) => {
    if (!challengeToken) return;

    setIsSubmitting(true);
    try {
      const response = await verifyLoginOtp(challengeToken, data.otp);
      queryClient.clear();
      setUser(response.user);
      toast.success("Welcome back!");
      const redirect = searchParams.get("redirect") ?? "/tasks";
      router.push(redirect);
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Invalid or expired verification code"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!challengeToken) return;

    setIsResending(true);
    try {
      await resendLoginOtp(challengeToken);
      toast.success("A new code has been sent");
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Could not resend code. Please sign in again."));
      setStep("credentials");
      setChallengeToken(null);
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    setStep("credentials");
    setChallengeToken(null);
    otpForm.reset({ otp: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-xl font-bold shadow-lg shadow-indigo-200 mb-4">
            TF
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to TaskFlow</h1>
          <p className="text-slate-500 mt-1">
            {step === "credentials"
              ? "Sign in to manage tasks and annotate images"
              : "Enter the verification code sent to your email"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-8">
          {step === "credentials" ? (
            <form onSubmit={loginForm.handleSubmit(onCredentialsSubmit)} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-rose-600">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-rose-600">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                {isSubmitting ? "Sending code…" : "Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
              <p className="text-sm text-slate-600 text-center">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-slate-900">{maskedEmail}</span>
              </p>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Verification code
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors tracking-[0.3em] text-center text-lg font-mono"
                  {...otpForm.register("otp")}
                />
                {otpForm.formState.errors.otp && (
                  <p className="mt-1 text-sm text-rose-600">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                {isSubmitting ? "Verifying…" : "Verify and sign in"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-60"
                >
                  {isResending ? "Sending…" : "Resend code"}
                </button>
              </div>
            </form>
          )}

          {step === "credentials" && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Create one
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
