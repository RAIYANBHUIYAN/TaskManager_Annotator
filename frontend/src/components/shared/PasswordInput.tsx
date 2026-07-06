"use client";

import { forwardRef, useState } from "react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ id, className = "", ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          className={`w-full px-4 py-2.5 pr-11 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors ${className}`}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
        >
          <span className="relative block w-5 h-5">
            <EyeIcon
              className={`absolute inset-0 w-5 h-5 transition-all duration-300 ease-out ${
                visible
                  ? "opacity-100 scale-100 rotate-0"
                  : "opacity-0 scale-75 rotate-90 pointer-events-none"
              }`}
            />
            <EyeOffIcon
              className={`absolute inset-0 w-5 h-5 transition-all duration-300 ease-out ${
                visible
                  ? "opacity-0 scale-75 -rotate-90 pointer-events-none"
                  : "opacity-100 scale-100 rotate-0"
              }`}
            />
          </span>
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
