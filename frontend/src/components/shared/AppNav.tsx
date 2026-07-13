"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  { href: "/tasks", label: "Tasks" },
  { href: "/annotate", label: "Annotate" },
];

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    queryClient.clear();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/tasks" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
              TF
            </span>
            <span className="font-semibold text-slate-900 hidden sm:inline">TaskFlow</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-slate-500 hidden sm:inline">{user.email}</span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
