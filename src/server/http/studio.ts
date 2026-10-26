import "server-only";
import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/server/modules/identity";
import { profileFor } from "@/server/modules/profiles";
import { writerNotebooks } from "@/server/modules/content";
import { pageDb } from "./now";

/** Studio gate: signed-in, writer role, approved/suspended profile. Others are sent to apply. */
export async function requireStudio() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?next=/studio");
  const db = await pageDb();
  const profile = hasRole(viewer, "writer") ? await profileFor(db, viewer.id) : undefined;
  if (!profile || !["approved", "suspended"].includes(profile.status)) redirect("/studio/apply");
  const notebooks = await writerNotebooks(db, viewer.id);
  return { viewer, profile, notebooks, db };
}
