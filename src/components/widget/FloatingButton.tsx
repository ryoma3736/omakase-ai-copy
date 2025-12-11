"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
  primaryColor?: string;
  position?: "bottom-right" | "bottom-left";
  unreadCount?: number;
}

export function FloatingButton({
  isOpen,
  onClick,
  primaryColor = "#6366f1",
  position = "bottom-right",
  unreadCount = 0,
}: FloatingButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const positionClasses = {
    "bottom-right": "right-4 bottom-4",
    "bottom-left": "left-4 bottom-4",
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative h-14 w-14 rounded-full shadow-lg transition-all duration-200 ease-in-out",
        "hover:shadow-xl hover:scale-105 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        positionClasses[position]
      )}
      style={{
        backgroundColor: primaryColor,
        boxShadow: isHovered
          ? `0 10px 25px -5px ${primaryColor}40`
          : `0 4px 12px -2px ${primaryColor}30`,
      }}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      {/* Unread badge */}
      {unreadCount > 0 && !isOpen && (
        <span
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold text-white flex items-center justify-center animate-pulse"
          style={{ backgroundColor: "#ef4444" }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}

      {/* Icon with transition */}
      <div className="relative w-full h-full flex items-center justify-center">
        <MessageSquare
          className={cn(
            "h-6 w-6 text-white transition-all duration-200",
            isOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
          )}
        />
        <X
          className={cn(
            "h-6 w-6 text-white absolute transition-all duration-200",
            isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
          )}
        />
      </div>

      {/* Ripple effect on click */}
      <span
        className={cn(
          "absolute inset-0 rounded-full animate-ping",
          isHovered && !isOpen ? "opacity-75" : "opacity-0"
        )}
        style={{ backgroundColor: primaryColor }}
      />
    </button>
  );
}
