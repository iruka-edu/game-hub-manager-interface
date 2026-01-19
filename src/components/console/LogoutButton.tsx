"use client";

import { useRouter } from "next/navigation";
import { useLogout } from "@/features/auth";

interface LogoutButtonProps {
  className?: string;
  title?: string;
}

export function LogoutButton({
  className = "p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800",
  title = "Đăng xuất",
}: LogoutButtonProps) {
  const router = useRouter();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      // Redirect to login page after logout
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if API call fails
      router.push("/login");
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
      className={className}
      title={title}
    >
      {logoutMutation.isPending ? (
        <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      )}
    </button>
  );
}

export default LogoutButton;
