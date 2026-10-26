import "server-only";
import { notFound, redirect } from "next/navigation";
import { getViewer, hasRole } from "@/server/modules/identity";
import { pageDb } from "./now";

/** Console gate: curator or admin. Everyone else gets a 404 — staff surfaces don't announce themselves. */
export async function requireCurator() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?next=/console");
  if (!hasRole(viewer, "curator")) notFound();
  return { viewer, db: await pageDb() };
}
