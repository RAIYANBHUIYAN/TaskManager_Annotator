"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import PasswordInput from "@/components/shared/PasswordInput";
import { adminLogin } from "@/lib/api";

const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: AdminLoginForm) => {
    setIsSubmitting(true);
    try {
      await adminLogin(data.username, data.password);
      toast.success("Admin access granted");
      router.push("/admin");
    } catch {
      toast.error("Invalid admin credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-700 text-white text-xl font-bold mb-4">
            AD
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 mt-1">Sign in to manage users</p>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                {...register("username")}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-rose-400">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="Enter admin password"
                className="border-slate-600 bg-slate-900 text-white"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-rose-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? "Signing in…" : "Sign in to admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
