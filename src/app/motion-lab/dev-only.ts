import { notFound } from "next/navigation";

/**
 * The motion lab is a review tool for the team, not part of the site. In a production build every lab route
 * answers 404 and the lab code is never rendered. Owner: motion-lead.
 */
export function assertDevOnly(): void {
  if (process.env.NODE_ENV === "production") notFound();
}
