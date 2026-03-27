/**
 * Recursively removes undefined values from an object before writing to Firestore.
 * Firestore throws if any field value is undefined, including nested ones.
 * Date objects and arrays are preserved as-is.
 */
export function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      result[key] = value.map(item =>
        item && typeof item === 'object' && !(item instanceof Date)
          ? stripUndefined(item)
          : item
      );
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      result[key] = stripUndefined(value);
    } else {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}
