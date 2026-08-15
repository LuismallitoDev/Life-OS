// Client-only localStorage wrapper. Every key is prefixed "fos_" so it never
// collides with anything else a browser extension or another app might set.
export const fos = {
  _key(key: string) {
    return `fos_${key}`;
  },
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(this._key(key));
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(this._key(key), JSON.stringify(value));
    } catch {
      // storage full or blocked — ignore, nothing to persist
    }
  },
  remove(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(this._key(key));
  },
  /** Removes every key this app has ever set (anything prefixed "fos_"). */
  clearAll() {
    if (typeof window === "undefined") return;
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("fos_")) toRemove.push(key);
    }
    toRemove.forEach((key) => window.localStorage.removeItem(key));
  },
  /** Returns every key this app has set (prefix stripped, values parsed). */
  exportAll(): Record<string, unknown> {
    if (typeof window === "undefined") return {};
    const out: Record<string, unknown> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith("fos_")) continue;
      try {
        out[key.slice(4)] = JSON.parse(window.localStorage.getItem(key) ?? "null");
      } catch {
        // skip anything that doesn't parse as JSON
      }
    }
    return out;
  },
};
