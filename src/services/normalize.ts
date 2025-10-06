export function normalizeArray<T>(data: T | T[] | undefined| null): T[] {
    if(!data) return [];
  return Array.isArray(data) ? data : [data];
}