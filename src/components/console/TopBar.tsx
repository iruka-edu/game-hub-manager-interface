"use client";

import { useState, useEffect, useRef } from "react";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/features/notifications";
import type { Notification } from "@/features/notifications";

interface TopBarProps {
  onToggleMinimize?: () => void;
  isMinimized?: boolean;
}

export function TopBar({ onToggleMinimize, isMinimized }: TopBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use notifications hooks
  const { notifications, unreadCount, isLoading, refetch } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  return (
    <div className="hidden lg:flex sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-8 py-3 items-center justify-between">
      {/* Left side - Minimize button */}
      <div className="flex items-center gap-3">
        {onToggleMinimize && (
          <button
            onClick={onToggleMinimize}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title={isMinimized ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMinimized ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7M19 19l-7-7 7-7"
                />
              )}
            </svg>
          </button>
        )}
      </div>

      {/* Right side - Notifications */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) refetch();
          }}
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Thông báo"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  {markAllAsReadMutation.isPending
                    ? "Đang xử lý..."
                    : "Đánh dấu đã đọc"}
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  Đang tải...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  Không có thông báo
                </div>
              ) : (
                notifications.map((n: Notification) => (
                  <a
                    key={n.id}
                    href={n.game_id ? `/console/games/${n.game_id}` : "#"}
                    onClick={() => handleMarkAsRead(n.id)}
                    className={`block p-3 hover:bg-slate-50 border-b border-slate-100 ${
                      n.is_read ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 mt-2 rounded-full ${
                          n.is_read ? "bg-slate-300" : "bg-indigo-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {n.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(n.created_at).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
