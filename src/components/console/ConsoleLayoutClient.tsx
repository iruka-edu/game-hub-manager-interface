"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

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
      <Sidebar user={user} isMinimized={isMinimized} />
      <div
        className={`flex-1 transition-[margin] duration-300 ${
          isMinimized ? "ml-[80px]" : "ml-[260px]"
        }`}
      >
        <TopBar
          onToggleMinimize={handleToggleMinimize}
          isMinimized={isMinimized}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
