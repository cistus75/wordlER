const memory = new Map<string, string | null>();
const pending = new Set<string>();

export function safeStorageGet(key: string): string | null {
  if (pending.has(key)) return memory.get(key) ?? null;
  try {
    const value = localStorage.getItem(key);
    memory.set(key, value);
    return value;
  } catch {
    return memory.get(key) ?? null;
  }
}

export function safeStorageSet(key: string, value: string): void {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
    pending.delete(key);
  } catch {
    pending.add(key);
  }
}

export function safeStorageRemove(key: string): void {
  memory.set(key, null);
  try {
    localStorage.removeItem(key);
    pending.delete(key);
  } catch {
    pending.add(key);
  }
}
