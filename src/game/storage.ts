export function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function safeStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}
