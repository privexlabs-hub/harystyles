import "server-only";
import type { DbOrTx } from "@/server/db/client";
import { outboxEvents } from "./schema";

/**
 * Transactional outbox (docs/02 §2.4/§2.7). Domain events are inserted in the same transaction as
 * the state change; `outbox.relay` dispatches them after commit. Payloads carry ids, never bodies.
 */
export type DomainEvent =
  | { type: "LetterPublished"; aggregateId: string; payload: { letterId: string; writerId: string; visibility: string } }
  | { type: "LetterWithdrawn"; aggregateId: string; payload: { letterId: string; writerId: string } }
  | { type: "WriterApproved"; aggregateId: string; payload: { writerId: string } }
  | { type: "ApplicationDecided"; aggregateId: string; payload: { userId: string; status: string } }
  | { type: "IssueLocked"; aggregateId: string; payload: { issueId: string } }
  | { type: "RationBuilt"; aggregateId: string; payload: { rationId: string; readerId: string } }
  | { type: "PreferencesChanged"; aggregateId: string; payload: { userId: string } };

const AGGREGATE: Record<DomainEvent["type"], string> = {
  LetterPublished: "letter",
  LetterWithdrawn: "letter",
  WriterApproved: "writer",
  ApplicationDecided: "writer_application",
  IssueLocked: "issue",
  RationBuilt: "ration",
  PreferencesChanged: "user",
};

export async function emit(tx: DbOrTx, event: DomainEvent): Promise<void> {
  await tx.insert(outboxEvents).values({
    aggregateType: AGGREGATE[event.type],
    aggregateId: event.aggregateId,
    type: event.type,
    payload: event.payload,
  });
}
