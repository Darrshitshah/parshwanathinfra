"use client";

/**
 * Client wrapper that mounts the diorama (`data-slot="diorama"`) around the static figure. The figure stays the server
 * rendered fallback; the slot swaps in the diorama near the viewport. Choosing a building opens it in the building
 * explorer on the project page (`?building=<id>#homes`).
 */
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { DioramaSlot } from "@/features/diorama";

export const PROJECT_EXPLORER_HREF = "/projects/shiv-shiva";

export function explorerHref(buildingId: string): string {
  return `${PROJECT_EXPLORER_HREF}?building=${encodeURIComponent(buildingId)}#homes`;
}

export function DioramaMount({ children }: { children: ReactNode }) {
  const router = useRouter();
  return <DioramaSlot onBuildingSelect={(id) => router.push(explorerHref(id))}>{children}</DioramaSlot>;
}
