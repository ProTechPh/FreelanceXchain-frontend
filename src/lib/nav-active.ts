/**
 * Whether a dashboard nav item should read as current for a given pathname.
 *
 * Exact matching left every detail route (`/contracts/[id]`, `/disputes/[id]`)
 * with no highlighted parent, so users lost their place as soon as they drilled
 * in. Section roots match their descendants; dashboard roots match only
 * themselves, since every route is nested under them.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  const isRoleRoot = /^\/dashboard\/(freelancer|employer|admin)$/.test(href);
  if (isRoleRoot) return false;
  // "Post a project" must not stay lit while browsing "My projects".
  if (href.endsWith('/new')) return false;
  return pathname.startsWith(`${href}/`);
}
