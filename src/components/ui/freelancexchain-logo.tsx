import React from 'react';

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * FreelanceXchain sparkle 'X' mark.
 *
 * Gradient stops read from the --brand-* ramp rather than fixed emerald, so the
 * mark tracks --primary and re-lights itself for the dark surface.
 */
export function FreelanceXchainIcon({ size = 32, className = '', ...props }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <defs>
        {/* Glowing radial core */}
        <radialGradient id="fxcCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--brand-1)" stopOpacity="1" />
          <stop offset="35%" stopColor="var(--brand-2)" stopOpacity="0.85" />
          <stop offset="70%" stopColor="var(--brand-3)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--brand-3)" stopOpacity="0" />
        </radialGradient>

        {/* Primary Emerald Gradient */}
        <linearGradient id="fxcEmeraldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-1)" />
          <stop offset="45%" stopColor="var(--brand-2)" />
          <stop offset="100%" stopColor="var(--brand-3)" />
        </linearGradient>

        <linearGradient id="fxcEmeraldGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-1)" />
          <stop offset="50%" stopColor="var(--brand-2)" />
          <stop offset="100%" stopColor="var(--brand-3)" />
        </linearGradient>

        {/* Crystalline Facet Highlight */}
        <linearGradient id="fxcFacetLight" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="60%" stopColor="var(--brand-1)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--brand-2)" stopOpacity="0.1" />
        </linearGradient>

        {/* Filter Glow */}
        <filter id="fxcGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ambient Outer Glow */}
      <circle cx="50" cy="50" r="32" fill="url(#fxcCoreGlow)" />

      {/* Main Sparkle 'X' Wings */}
      <g filter="url(#fxcGlowFilter)">
        {/* Top Wing */}
        <polygon points="50,6 63,40 50,47 37,40" fill="url(#fxcEmeraldGrad1)" />
        <polygon points="50,6 50,47 37,40" fill="url(#fxcFacetLight)" />

        {/* Bottom Wing */}
        <polygon points="50,94 63,60 50,53 37,60" fill="url(#fxcEmeraldGrad1)" />
        <polygon points="50,94 50,53 63,60" fill="url(#fxcFacetLight)" />

        {/* Left Wing */}
        <polygon points="6,50 40,37 47,50 40,63" fill="url(#fxcEmeraldGrad2)" />
        <polygon points="6,50 47,50 40,37" fill="url(#fxcFacetLight)" />

        {/* Right Wing */}
        <polygon points="94,50 60,37 53,50 60,63" fill="url(#fxcEmeraldGrad2)" />
        <polygon points="94,50 53,50 60,63" fill="url(#fxcFacetLight)" />

        {/* Diagonal X-Cross Prisms (Top-Left to Bottom-Right) */}
        <polygon points="18,18 43,43 36,50 11,25" fill="url(#fxcEmeraldGrad1)" />
        <polygon points="82,82 57,57 64,50 89,75" fill="url(#fxcEmeraldGrad1)" />

        {/* Diagonal X-Cross Prisms (Top-Right to Bottom-Left) */}
        <polygon points="82,18 57,43 64,50 89,25" fill="url(#fxcEmeraldGrad2)" />
        <polygon points="18,82 43,57 36,50 11,75" fill="url(#fxcEmeraldGrad2)" />

        {/* Inner Diamond Prism */}
        <polygon points="50,30 70,50 50,70 30,50" fill="url(#fxcEmeraldGrad1)" />
        <polygon points="50,30 50,70 30,50" fill="url(#fxcFacetLight)" />

        {/* Top/Bottom Diamond Satellite Accent Nodes */}
        <polygon points="50,16 55,23 50,30 45,23" fill="var(--brand-1)" />
        <polygon points="50,70 55,77 50,84 45,77" fill="var(--brand-1)" />
        <polygon points="16,50 23,45 30,50 23,55" fill="var(--brand-1)" />
        <polygon points="70,50 77,45 84,50 77,55" fill="var(--brand-1)" />

        {/* Ultra-Bright Center Core Star Sparkle */}
        <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" />
        <path d="M50,36 L52,48 L64,50 L52,52 L50,64 L48,52 L36,50 L48,48 Z" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

interface LogoProps {
  className?: string;
  iconSize?: number;
  showIcon?: boolean;
}

/**
 * Official FreelanceXchain Full Wordmark with Transparent Background
 * Seamlessly adapts text color to light mode (dark text) and dark mode (white text)
 * with the highlighted glowing Emerald Sparkle X.
 */
export function FreelanceXchainLogo({
  className = '',
  iconSize = 30,
  showIcon = true,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {showIcon && (
        <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
          <FreelanceXchainIcon size={iconSize} />
        </div>
      )}
      <span className="font-extrabold text-lg text-foreground tracking-tight flex items-center">
        Freelance
        <span className="text-primary font-black px-0.5">
          X
        </span>
        chain
      </span>
    </div>
  );
}
