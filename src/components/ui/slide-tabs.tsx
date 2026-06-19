"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SlideTabsProps {
  tabs?: string[];
  defaultIndex?: number;
  onSelect?: (index: number) => void;
  className?: string;
}

export const SlideTabs = ({
  tabs = ["For Freelancers", "For Employers", "For Both"],
  defaultIndex = 0,
  onSelect,
  className,
}: SlideTabsProps) => {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [selected, setSelected] = useState(defaultIndex);
  const tabsRef = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const selectedTab = tabsRef.current[selected];
    if (selectedTab) {
      const { width } = selectedTab.getBoundingClientRect();
      setPosition({
        left: selectedTab.offsetLeft,
        width,
        opacity: 1,
      });
    }
  }, [selected]);

  const handleSelect = (index: number) => {
    setSelected(index);
    onSelect?.(index);
  };

  return (
    <ul
      onMouseLeave={() => {
        const selectedTab = tabsRef.current[selected];
        if (selectedTab) {
          const { width } = selectedTab.getBoundingClientRect();
          setPosition({
            left: selectedTab.offsetLeft,
            width,
            opacity: 1,
          });
        }
      }}
      className={cn(
        "relative mx-auto flex w-fit rounded-full border border-border bg-card p-1",
        className
      )}
    >
      {tabs.map((tab, i) => (
        <Tab
          key={tab}
          ref={(el) => {
            tabsRef.current[i] = el;
          }}
          setPosition={setPosition}
          onClick={() => handleSelect(i)}
          isSelected={i === selected}
        >
          {tab}
        </Tab>
      ))}

      <Cursor position={position} />
    </ul>
  );
};

interface TabProps {
  children: React.ReactNode;
  setPosition: (pos: { left: number; width: number; opacity: number }) => void;
  onClick: () => void;
  isSelected: boolean;
}

const Tab = React.forwardRef<HTMLLIElement, TabProps>(
  ({ children, setPosition, onClick, isSelected }, ref) => {
    return (
      <li
        ref={ref}
        onClick={onClick}
        onMouseEnter={() => {
          if (!ref || typeof ref === "function" || !ref.current) return;

          const { width } = ref.current.getBoundingClientRect();

          setPosition({
            left: ref.current.offsetLeft,
            width,
            opacity: 1,
          });
        }}
        className={cn(
          "relative z-10 block cursor-pointer px-3 py-1.5 text-xs uppercase transition-colors duration-200 md:px-5 md:py-3 md:text-sm",
          isSelected
            ? "text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {children}
      </li>
    );
  }
);

Tab.displayName = "Tab";

interface CursorProps {
  position: {
    left: number;
    width: number;
    opacity: number;
  };
}

const Cursor = ({ position }: CursorProps) => {
  return (
    <motion.li
      animate={{
        ...position,
      }}
      className="absolute z-0 h-7 rounded-full gradient-primary md:h-12"
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    />
  );
};
