"use client";

import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "gradient" | "bordered";
  hoverEffect?: boolean;
}

export const Card = ({
  className,
  children,
  variant = "default",
  hoverEffect = false,
  ...props
}: CardProps) => {
  const variants = {
    default: "bg-slate-900/80 border border-slate-800 text-slate-100 shadow-lg shadow-black/40",
    glass: "bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-2xl",
    gradient:
      "bg-gradient-to-br from-slate-900 via-slate-900/90 to-brand-950/40 border border-slate-800 text-slate-100",
    bordered: "bg-transparent border-2 border-slate-800 text-slate-100",
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-200",
        variants[variant],
        hoverEffect && "hover:border-slate-700 hover:shadow-brand-500/5 hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
