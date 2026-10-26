"use client";
import { useTransition } from "react";
import { deleteKeptLineAction } from "@/features/reader/actions";
import { IconButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

export function RemoveKeptButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <IconButton label="Remove this kept line" disabled={pending} onClick={() => start(async () => void (await deleteKeptLineAction(id)))}>
      <Icon.close />
    </IconButton>
  );
}
