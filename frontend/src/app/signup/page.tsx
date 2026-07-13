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
import { register as registerUser, resendLoginOtp, verifyLoginOtp } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const signupSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirm: z.string().min(1, "Please confirm your password"),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d{6}$/, "Code must be 6 digits"),
});

type SignupForm = z.infer<typeof signupSchema>;
type OtpForm = z.infer<typeof otpSchema>;

function getRegisterErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error) || !error.response?.data) {
    return "Could not create account. Please try again.";
  }

  const data = error.response.data as Record<string, unknown>;
  if (typeof data.detail === "string") {
    return data.detail;
  }

  const messages: string[] = [];

  for (const value of Object.values(data)) {
    if (typeof value === "string") {
      messages.push(value);
    } else if (Array.isArray(value)) {
      messages.push(...value.filter((item): item is string => typeof item === "string"));
    }
  }

  return messages[0] ?? "Could not create account. Please try again.";
}

function getOtpErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    if (typeof data.detail === "string") return data.detail;
  }
  return "Invalid or expired verification code";
}

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState<"details" | "otp">("details");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      password_confirm: "",
      first_name: "",
      last_name: "",
    },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onDetailsSubmit = async (data: SignupForm) => {
    setIsSubmitting(true);
    try {
      const challenge = await registerUser(data);
      setChallengeToken(challenge.challenge_token);
      setMaskedEmail(challenge.email);
      setStep("otp");
      otpForm.reset({ otp: "" });
      toast.success("Verification code sent to your email");
    } catch (error) {
      toast.error(getRegisterErrorMessage(error));
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
      toast.success("Email verified! Welcome to TaskFlow.");
      const redirect = searchParams.get("redirect") ?? "/tasks";
      router.push(redirect);
    } catch (error) {
      toast.error(getOtpErrorMessage(error));
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
      toast.error(getOtpErrorMessage(error));
      setStep("details");
      setChallengeToken(null);
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    setStep("details");
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
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-1">
            {step === "details"
              ? "Sign up to manage your own tasks and annotations"
              : "Verify your email to activate your account"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-8">
          {step === "details" ? (
            <form onSubmit={signupForm.handleSubmit(onDetailsSubmit)} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
                  {...signupForm.register("email")}
                />
                {signupForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-rose-600">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    First name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    autoComplete="given-name"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
                    {...signupForm.register("first_name")}
                  />
                </div>
                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Last name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    autoComplete="family-name"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
                    {...signupForm.register("last_name")}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...signupForm.register("password")}
                />
                {signupForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-rose-600">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password_confirm"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Confirm password
                </label>
                <PasswordInput
                  id="password_confirm"
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  {...signupForm.register("password_confirm")}
                />
                {signupForm.formState.errors.password_confirm && (
                  <p className="mt-1 text-sm text-rose-600">
                    {signupForm.formState.errors.password_confirm.message}
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
                We sent a 6-digit verification code to{" "}
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
                {isSubmitting ? "Verifying…" : "Verify email and create account"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleBack}
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

          {step === "details" && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SignupFormContent />
    </Suspense>
  );
}
