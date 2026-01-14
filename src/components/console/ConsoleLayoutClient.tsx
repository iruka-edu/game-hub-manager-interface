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
  createdAt: string;
  updatedAt: string;
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
    <div className="flex min-h-screen">
      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar user={user} isMinimized={isMinimized} />
      
      {/* Mobile Navigation */}
      <MobileNav user={user} />
      
      {/* Main Content */}
      <div
        className={`flex-1 transition-[margin] duration-300 ml-0 ${
          isMinimized ? "lg:ml-[80px]" : "lg:ml-[260px]"
        }`}
      >
        <TopBar
          onToggleMinimize={handleToggleMinimize}
          isMinimized={isMinimized}
        />
        <main className="p-4 sm:p-6 pt-16 lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
