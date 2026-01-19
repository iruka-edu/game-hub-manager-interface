"use client";

import { ConsoleLayoutClient } from "@/components/console/ConsoleLayoutClient";
import { useSession } from "@/features/auth";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user from session hook (token-based auth)
  const { user, isLoading } = useSession();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // User data for layout
  const serializedUser = user
    ? {
        _id: user.id,
        email: user.email,
        name: user.full_name,
        roles: user.roles,
        isActive: user.is_active,
      }
    : null;

  if (!serializedUser) {
    // Middleware should have redirected, but just in case
    return null;
  }

  return (
    <ConsoleLayoutClient user={serializedUser}>{children}</ConsoleLayoutClient>
  );
}
