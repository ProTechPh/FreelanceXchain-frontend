import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * EscrowVaultIcon - Non-custodial dual-key locked vault
 */
export function EscrowVaultIcon({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 10v4" />
      <path d="M10 12h4" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="18" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
      <circle cx="18" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * MilestoneScopeIcon - Structured deliverable roadmap with connected nodes
 */
export function MilestoneScopeIcon({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="5" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <circle cx="19" cy="8" r="2.5" />
      <path d="M7.5 7.5L9.5 16.5" />
      <path d="M14.5 16.5L16.5 9.5" />
      <path d="M12 2v2" />
    </svg>
  );
}

/**
 * InstantSettlementIcon - Lightning-fast direct wallet-to-wallet transfer
 */
export function InstantSettlementIcon({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

/**
 * IdentityVerificationIcon - Biometric/DID verified badge shield
 */
export function IdentityVerificationIcon({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2l7 3.5v6c0 5-3.5 9.5-7 10.5-3.5-1-7-5.5-7-10.5v-6l7-3.5z" />
      <circle cx="12" cy="9" r="2.5" />
      <path d="M8.5 15.5c.8-1.5 2-2 3.5-2s2.7.5 3.5 2" />
    </svg>
  );
}

/**
 * ContractWorkspaceIcon - Split view deliverable review workbench
 */
export function ContractWorkspaceIcon({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M14 8h4" />
      <path d="M14 12h4" />
      <path d="M14 16h2" />
      <circle cx="6" cy="7" r="1" fill="currentColor" />
      <circle cx="6" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * OnChainReputationIcon - Immutable on-chain tokenized credentials
 */
export function OnChainReputationIcon({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**
 * VerifiedCheckIcon - Precise circular verification checkmark
 */
export function VerifiedCheckIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" />
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 8.2L7 10.2L11 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * GitHubIcon - Official brand mark for repository link
 */
export function GitHubIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

// ─── Landing-page UI icons ────────────────────────────────────────────────────
// Custom replacements for the most recognisable lucide-react shapes so the
// public site stops matching stock shadcn output.

/**
 * NavMenuIcon - Compact staggered-weight hamburger (3 bars, middle shorter)
 */
export function NavMenuIcon({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <line x1="2" y1="4.5" x2="16" y2="4.5" />
      <line x1="2" y1="9" x2="12" y2="9" />
      <line x1="2" y1="13.5" x2="16" y2="13.5" />
    </svg>
  );
}

/**
 * NavSearchIcon - Loupe with an angled handle at 225°
 */
export function NavSearchIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="6.5" cy="6.5" r="4" />
      <path d="M9.75 9.75L13.5 13.5" />
    </svg>
  );
}

/**
 * NavDashboardIcon - Four-quadrant grid with top-left quad enlarged
 */
export function NavDashboardIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="1.5" y="1.5" width="5.5" height="7" rx="1" />
      <rect x="9" y="1.5" width="5.5" height="4" rx="1" />
      <rect x="9" y="7.5" width="5.5" height="7" rx="1" />
      <rect x="1.5" y="10.5" width="5.5" height="4" rx="1" />
    </svg>
  );
}

/**
 * NavUserIcon - Minimal person silhouette with narrower head radius
 */
export function NavUserIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="8" cy="5" r="2.75" />
      <path d="M2 14c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    </svg>
  );
}

/**
 * NavLogOutIcon - Door with right-arrow exit, not the standard lucide shape
 */
export function NavLogOutIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" />
      <path d="M10.5 5L14 8l-3.5 3" />
      <path d="M14 8H6" />
    </svg>
  );
}

/**
 * XCloseIcon - Asymmetric ×, thinner and slightly rotated feel vs lucide X
 */
export function XCloseIcon({ size = 14, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M2.5 2.5L11.5 11.5" />
      <path d="M11.5 2.5L2.5 11.5" />
    </svg>
  );
}

/**
 * ChevronDownIcon - Softer caret, less pointy than lucide ChevronDown
 */
export function ChevronDownIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M3.5 6L8 10.5L12.5 6" />
    </svg>
  );
}

/**
 * ArrowRightIcon - Weighted arrow with a slightly wider head
 */
export function ArrowRightIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M3 8h10" />
      <path d="M9 4l4 4-4 4" />
    </svg>
  );
}

/**
 * BriefcaseIcon - Laptop-bag outline, distinctly taller than lucide Briefcase
 */
export function BriefcaseIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="1.5" y="5.5" width="13" height="9" rx="1.5" />
      <path d="M5.5 5.5V4a1.5 1.5 0 013 0v1.5" />
      <path d="M1.5 9.5h13" />
    </svg>
  );
}

/**
 * UserSearchIcon - Person with a small loupe overlay, distinct from lucide UserRoundSearch
 */
export function UserSearchIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1.5 14c0-2.8 2-4.5 4.5-4.5" />
      <circle cx="12" cy="11.5" r="2" />
      <path d="M13.5 13L15 14.5" />
    </svg>
  );
}

/**
 * ShieldEscrowIcon - Shield with lock body (CTA badge: 100% Smart Contract Escrow)
 */
export function ShieldEscrowIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M8 1.5L13.5 4v4c0 3.5-2.5 6.5-5.5 7-3-0.5-5.5-3.5-5.5-7V4L8 1.5z" />
      <rect x="5.5" y="7" width="5" height="3.5" rx="0.75" />
      <path d="M8 7V5.5a1.5 1.5 0 013 0V7" />
    </svg>
  );
}

/**
 * GlobalKycIcon - Globe with a checkmark overlay (CTA badge: KYC 220+ countries)
 */
export function GlobalKycIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="8" cy="8" r="6.5" />
      <path d="M1.5 8h13" />
      <path d="M8 1.5c-2 2-3 4.1-3 6.5s1 4.5 3 6.5" />
      <path d="M8 1.5c2 2 3 4.1 3 6.5s-1 4.5-3 6.5" />
    </svg>
  );
}

/**
 * ReceiptGuaranteeIcon - Receipt with a check at the bottom (CTA badge: Zero Unpaid Invoices)
 */
export function ReceiptGuaranteeIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M3 1.5h10a.5.5 0 01.5.5v12l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5V2a.5.5 0 01.5-.5z" />
      <path d="M5.5 5.5h5" />
      <path d="M5.5 8h5" />
      <path d="M5.5 10.5l1.5 1.5 2.5-2.5" />
    </svg>
  );
}

/**
 * SparkleIcon - Four-point star burst, unlike lucide's Sparkles multi-star
 */
export function SparkleIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M8 1.5v13M1.5 8h13M4 4l8 8M12 4l-8 8" strokeWidth="1.25" opacity="0.4" />
      <path d="M8 2.5L8.75 6.5 12.5 8l-3.75 1.5L8 13.5l-.75-4L3.5 8l3.75-1.5L8 2.5z" />
    </svg>
  );
}

/**
 * EcosystemGlobeIcon - Simple wireframe globe for the ecosystem section header
 */
export function EcosystemGlobeIcon({ size = 14, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="7" cy="7" r="5.5" />
      <path d="M1.5 7h11" />
      <path d="M7 1.5C5.5 3 4.5 4.9 4.5 7s1 4 2.5 5.5" />
      <path d="M7 1.5C8.5 3 9.5 4.9 9.5 7s-1 4-2.5 5.5" />
    </svg>
  );
}

/**
 * TableCheckIcon - Bold square check for the comparison table FreelanceXchain column
 */
export function TableCheckIcon({ size = 16, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M2.5 8.5L6 12L13.5 4" />
    </svg>
  );
}


