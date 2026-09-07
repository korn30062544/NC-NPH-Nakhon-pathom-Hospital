/**
 * Firestore rejects `undefined` field values (throws at write time). The
 * app's TypeScript interfaces have many optional (`?:`) fields that are
 * frequently just literally `undefined` at runtime, so every object written
 * to Firestore must be sanitized first. This recursively strips any key
 * whose value is `undefined`, leaving everything else untouched.
 */
export function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeForFirestore(v)) as unknown as T;
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, any> = {};
    Object.entries(value as Record<string, any>).forEach(([key, v]) => {
      if (v === undefined) return;
      out[key] = sanitizeForFirestore(v);
    });
    return out as T;
  }
  return value;
}
