import React from 'react';

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/*
 * Mark geometry, in the 0–100 viewBox.
 *
 * Two identical capsule links, rotated ±45° about the centre, cross to form the
 * "X" of FreelanceXchain — and because each link is a hollow ring they read as
 * two links of a chain, interlocked. That is the whole brand in one shape:
 * an exchange (X) bound by a chain (escrow that neither side can walk away from).
 *
 * The links cross at four points — (50,26), (74,50), (50,74), (26,50). A real
 * interlock is over on one of the partner's sides and under on the other, so the
 * ascending link is masked away where it meets the descending link's upper-right
 * side (the x > y half-plane, which is that link's own centreline). Everywhere
 * else it paints on top. That single weave is what stops the mark from reading
 * as two flat crossed loops.
 *
 * MASK_STROKE is wider than STROKE so the weave opens a hairline of daylight
 * instead of butting two same-colour strokes together, which turns to mud at
 * favicon size.
 */
const LINK = { x: 0, y: 37, width: 100, height: 26, rx: 13 } as const;
const STROKE = 10.5;
const MASK_STROKE = 14;

/**
 * FreelanceXchain interlocked-links mark.
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
      aria-hidden="true"
      {...props}
    >
      <defs>
        {/* Front link catches the light; back link falls away into the deep end
            of the ramp. Reads as depth in both themes without a drop shadow. */}
        <linearGradient id="fxcLinkFront" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand-1)" />
          <stop offset="100%" stopColor="var(--brand-2)" />
        </linearGradient>
        <linearGradient id="fxcLinkBack" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand-2)" />
          <stop offset="100%" stopColor="var(--brand-3)" />
        </linearGradient>

        {/* x > y — the half of the descending link that passes in front. */}
        <clipPath id="fxcOverSide">
          <polygon points="0,0 100,0 100,100" />
        </clipPath>

        {/* userSpaceOnUse, not the default objectBoundingBox: the bbox excludes
            the stroke, so a proportional mask region clips the link's tips. */}
        <mask id="fxcWeave" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" />
          <g clipPath="url(#fxcOverSide)">
            <rect
              {...LINK}
              transform="rotate(45 50 50)"
              fill="none"
              stroke="#000"
              strokeWidth={MASK_STROKE}
            />
          </g>
        </mask>
      </defs>

      {/* Descending link — top-left to bottom-right. */}
      <rect
        {...LINK}
        transform="rotate(45 50 50)"
        fill="none"
        stroke="url(#fxcLinkBack)"
        strokeWidth={STROKE}
      />

      {/* Ascending link — bottom-left to top-right, woven under the above. */}
      <g mask="url(#fxcWeave)">
        <rect
          {...LINK}
          transform="rotate(-45 50 50)"
          fill="none"
          stroke="url(#fxcLinkFront)"
          strokeWidth={STROKE}
        />
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
 * FreelanceXchain lockup — interlocked-links mark plus wordmark.
 *
 * The wordmark inherits --foreground and the pivot X takes --primary, so the
 * lockup carries itself on both surfaces with no per-theme override.
 */
export function FreelanceXchainLogo({
  className = '',
  iconSize = 30,
  showIcon = true,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {showIcon && (
        <FreelanceXchainIcon
          size={iconSize}
          className="transition-transform duration-200 group-hover:scale-105"
        />
      )}
      {/* No horizontal padding on the X — it is a letter in the word, not a
          separator, and padding here visibly breaks "FreelanceXchain" in two. */}
      <span className="font-extrabold text-lg text-foreground tracking-tight leading-none">
        Freelance<span className="text-primary font-black">X</span>chain
      </span>
    </div>
  );
}
