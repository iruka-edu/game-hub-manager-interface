"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";

import type { Role } from "@/models/User";

interface SerializedUser {
  _id: string;
  email: string;
  name: string;
  roles: Role[];
  isActive: boolean;
  avatar?: string;
  teamIds?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ConsoleLayoutClientProps {
  user: SerializedUser;
  children: React.ReactNode;
}

export function ConsoleLayoutClient({
  user,
  children,
}: ConsoleLayoutClientProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar user={user} isMinimized={isMinimized} />

      {/* Mobile Navigation - includes mobile header */}
      <MobileNav user={user} />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isMinimized ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Desktop TopBar */}
        <TopBar
          onToggleMinimize={handleToggleMinimize}
          isMinimized={isMinimized}
        />

        {/* Main Content Area - with proper spacing for mobile header */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
