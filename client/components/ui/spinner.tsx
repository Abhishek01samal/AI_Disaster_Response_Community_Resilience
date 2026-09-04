"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  text?: string;
  variant?: "default" | "button";
}

export function Spinner({
  className,
  size = "md",
  showText = false,
  text = "Loading...",
  variant = "default",
  ...props
}: SpinnerProps) {
  const sizeClasses = {
    sm: "size-4 border-2",
    md: "size-8 border-[3px]",
    lg: "size-12 border-4",
    xl: "size-16 border-4",
  };

  const ringStyles =
    variant === "button"
      ? "border-current/20 border-t-current border-l-current/50"
      : "border-transparent border-t-foreground border-l-foreground/50";

  const trackStyles =
    variant === "button" ? "border-transparent" : "border-muted/50";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className
      )}
      {...props}
    >
      <div className="relative flex items-center justify-center">
        {/* Background track ring */}
        <div
          className={cn(
            "absolute rounded-full",
            trackStyles,
            sizeClasses[size]
          )}
        />
        {/* Foreground spinning ring */}
        <div
          className={cn(
            "animate-spin rounded-full",
            ringStyles,
            sizeClasses[size]
          )}
        />
      </div>

      {showText && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">
          {text}
        </p>
      )}
    </div>
  );
}
