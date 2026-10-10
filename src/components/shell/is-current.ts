/** A nav item is current on its own path, and on any page beneath it (Projects on a project page). */
export function isCurrent(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
