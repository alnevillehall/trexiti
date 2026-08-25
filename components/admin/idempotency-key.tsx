import { randomUUID } from "node:crypto";

export function IdempotencyKey({ prefix }: { prefix: string }) {
  return <input type="hidden" name="idempotencyKey" value={`admin:${prefix}:${randomUUID()}`} />;
}

