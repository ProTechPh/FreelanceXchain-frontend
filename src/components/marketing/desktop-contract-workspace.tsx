"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ContractWorkspacePreview = dynamic(
  () => import("@/components/marketing/contract-workspace-preview").then((module) => module.ContractWorkspacePreview),
  { ssr: false },
);

export function DesktopContractWorkspace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    if (!media.matches) return;

    const node = containerRef.current;
    if (!node || !("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Interactive contract workspace preview"
      aria-busy={!shouldRender || undefined}
      className="relative mx-auto mt-14 hidden min-h-[460px] max-w-5xl md:block"
    >
      {shouldRender ? <ContractWorkspacePreview /> : <div className="h-[460px] rounded-2xl border border-border bg-muted/20 animate-shimmer" aria-hidden="true" />}
    </div>
  );
}
