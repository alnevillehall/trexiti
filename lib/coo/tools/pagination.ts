import { z } from "zod";

const cursorPayloadSchema = z.object({
  version: z.literal(1),
  namespace: z.string().min(1).max(240),
  recordId: z.string().min(1).max(240),
});

export type CooCursorPage<T> = {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
};

export function encodeCooCursor(namespace: string, recordId: string) {
  const payload = cursorPayloadSchema.parse({
    version: 1,
    namespace,
    recordId,
  });
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCooCursor(
  cursor: unknown,
  namespace: string,
): string | undefined {
  if (cursor == null) return undefined;
  const encoded = z.string().min(1).max(1_024).parse(cursor);
  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new Error("The pagination cursor is invalid.");
  }
  const payload = cursorPayloadSchema.parse(decoded);
  if (payload.namespace !== namespace) {
    throw new Error("The pagination cursor does not match this query.");
  }
  return payload.recordId;
}

export function mapCursorPage<T>(
  page: { items: T[]; hasMore: boolean; nextCursor: string | null },
  namespace: string,
): CooCursorPage<T> {
  return {
    items: page.items,
    hasMore: page.hasMore,
    nextCursor:
      page.hasMore && page.nextCursor
        ? encodeCooCursor(namespace, page.nextCursor)
        : null,
  };
}

export function paginateStableRecords<T extends { id: string }>(input: {
  items: readonly T[];
  limit: number;
  cursor: unknown;
  namespace: string;
}): CooCursorPage<T> {
  const afterId = decodeCooCursor(input.cursor, input.namespace);
  const foundIndex = afterId
    ? input.items.findIndex((item) => item.id === afterId)
    : -1;
  if (afterId && foundIndex < 0) {
    throw new Error("The pagination cursor is stale or no longer visible.");
  }
  const startIndex = foundIndex + 1;
  const items = input.items.slice(startIndex, startIndex + input.limit);
  const hasMore = startIndex + items.length < input.items.length;
  return {
    items,
    hasMore,
    nextCursor:
      hasMore && items.length
        ? encodeCooCursor(input.namespace, items.at(-1)!.id)
        : null,
  };
}

export async function collectFilteredCursorPage<T extends { id: string }>(input: {
  cursor: unknown;
  namespace: string;
  limit: number;
  predicate: (item: T) => boolean;
  fetchPage: (options: {
    cursor?: string;
    take: number;
  }) => Promise<{ items: T[]; hasMore: boolean; nextCursor: string | null }>;
}): Promise<CooCursorPage<T>> {
  const initialCursor = decodeCooCursor(input.cursor, input.namespace);
  const batchSize = Math.min(100, Math.max(input.limit, 25));
  let scanCursor = initialCursor;
  const items: T[] = [];

  while (true) {
    const page = await input.fetchPage({ cursor: scanCursor, take: batchSize });
    for (const [index, item] of page.items.entries()) {
      if (!input.predicate(item)) continue;
      items.push(item);
      if (items.length < input.limit) continue;

      const remainingMatch = page.items
        .slice(index + 1)
        .some(input.predicate);
      let hasMore = remainingMatch;
      let lookAheadCursor = page.nextCursor;
      let lookAheadHasMore = page.hasMore;
      while (!hasMore && lookAheadHasMore && lookAheadCursor) {
        const lookAhead = await input.fetchPage({
          cursor: lookAheadCursor,
          take: batchSize,
        });
        hasMore = lookAhead.items.some(input.predicate);
        lookAheadCursor = lookAhead.nextCursor;
        lookAheadHasMore = lookAhead.hasMore;
      }

      return {
        items,
        hasMore,
        nextCursor: hasMore
          ? encodeCooCursor(input.namespace, item.id)
          : null,
      };
    }

    if (!page.hasMore || !page.nextCursor) {
      return { items, hasMore: false, nextCursor: null };
    }
    scanCursor = page.nextCursor;
  }
}
