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
import { register as registerUser } from "@/lib/api";
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

type SignupForm = z.infer<typeof signupSchema>;

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

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      password_confirm: "",
      first_name: "",
      last_name: "",
    },
  });

  const onSubmit = async (data: SignupForm) => {
    setIsSubmitting(true);
    try {
      const response = await registerUser(data);
      queryClient.clear();
      setUser(response.user);
      toast.success("Account created! Welcome to TaskFlow.");
      const redirect = searchParams.get("redirect") ?? "/tasks";
      router.push(redirect);
    } catch (error) {
      toast.error(getRegisterErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
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
            Sign up to manage your own tasks and annotations
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  First name
                </label>
                <input
                  id="first_name"
                  type="text"
                  autoComplete="given-name"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
                  {...register("first_name")}
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Last name
                </label>
                <input
                  id="last_name"
                  type="text"
                  autoComplete="family-name"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
                  {...register("last_name")}
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
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p>
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
                {...register("password_confirm")}
              />
              {errors.password_confirm && (
                <p className="mt-1 text-sm text-rose-600">{errors.password_confirm.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign in
            </Link>
          </p>
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
