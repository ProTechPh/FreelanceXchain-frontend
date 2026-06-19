"use client";

import { cn } from "@/lib/utils";

interface MarqueeProps {
  className?: string;
  children: React.ReactNode;
  repeat?: number;
  reverse?: boolean;
}

export const Marquee = ({
  className,
  children,
  repeat = 2,
  reverse = false,
}: MarqueeProps) => {
  return (
    <div
      className={cn(
        "flex w-fit overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "flex w-fit animate-marquee",
          reverse && "animate-marquee-reverse"
        )}
        style={{
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {Array.from({ length: repeat }).map((_, i) => (
          <div key={i} className="flex w-fit shrink-0 gap-[--gap]">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
};
