import { defineMiddleware } from "astro:middleware";
import { getUserFromRequest, clearSessionCookie } from "./lib/session";
import {
  checkPageAccess,
  getRequiredPermission,
  getUserPermissions,
} from "./lib/page-permissions";

/**
 * Protected route patterns
 */
const PROTECTED_PAGE_PATTERNS = ["/dashboard", "/console", "/admin"];
const PROTECTED_API_PATTERNS = [
  "/api/games",
  "/api/admin",
  "/api/debug",
  "/api/upload",
  "/api/notifications",
  "/api/audit-logs",
];

/**
 * Check if a path matches any of the patterns
 */
function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => path.startsWith(pattern));
}

/**
 * Generate 403 Forbidden HTML response
 */
function generate403Response(pathname: string): Response {
  // Return a redirect to 403 page with the original path
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/403",
    },
  });
}

/**
 * Astro middleware for session validation and route protection
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Check if route needs protection
  const isProtectedPage = matchesPattern(pathname, PROTECTED_PAGE_PATTERNS);
  const isProtectedApi = matchesPattern(pathname, PROTECTED_API_PATTERNS);

  if (!isProtectedPage && !isProtectedApi) {
    // Not a protected route, continue
    return next();
  }

  // Try to get user from session
  const user = await getUserFromRequest(context.request);

  if (!user) {
    // Session invalid or expired
    if (isProtectedApi) {
      // Return 401 for API routes
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": clearSessionCookie(),
        },
      });
    } else {
      // Redirect to login for page routes with return URL
      const returnUrl = encodeURIComponent(pathname + context.url.search);
      return context.redirect(`/login?redirect=${returnUrl}`);
    }
  }

  // Check page-level permissions for protected pages
  if (isProtectedPage) {
    const hasAccess = checkPageAccess(user, pathname);

    if (!hasAccess) {
      // User doesn't have permission - attach user to locals for 403 page
      context.locals.user = user;
      context.locals.permissions = getUserPermissions(user);
      return generate403Response(pathname);
    }
  }

  // Attach user and permissions to locals for downstream handlers
  context.locals.user = user;
  context.locals.permissions = getUserPermissions(user);

  return next();
});
