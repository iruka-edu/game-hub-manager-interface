/**
 * Jest Setup for Integration Tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock localStorage
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

if (typeof window === "undefined") {
  (global as any).localStorage = new LocalStorageMock();
  (global as any).window = { localStorage: (global as any).localStorage };
}

// Load env
try {
  require("dotenv").config({ path: ".env.local" });
  require("dotenv").config({ path: ".env" });
} catch (e) {}
