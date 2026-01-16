/**
 * Server-only wrapper for MiniGameQCService
 * This file ensures Playwright is never bundled for client
 */

import "server-only";

export * from "./MiniGameQCService";
