import type { APIRoute } from 'astro';
import { AuditLogger } from '../../lib/audit';
import { getUserFromRequest } from '../../lib/session';
import { hasPermissionString } from '../../auth/auth-rbac';
import type { ActionType, AuditLogFilter } from '../../lib/audit-types';

/**
 * GET /api/audit-logs
 * Fetch audit logs with filtering and pagination
 * Requires 'system:audit_view' permission
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permission
    if (!hasPermissionString(user, 'system:audit_view')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || undefined;
    const action = url.searchParams.get('action') as ActionType | undefined;
    const targetId = url.searchParams.get('targetId') || undefined;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;

    // Build filter
    const filter: AuditLogFilter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (targetId) filter.targetId = targetId;
    if (startDate) filter.startDate = new Date(startDate);
    if (endDate) filter.endDate = new Date(endDate);

    // Fetch logs
    const [logs, totalCount] = await Promise.all([
      AuditLogger.getLogs(filter, limit, skip),
      AuditLogger.getLogsCount(filter),
    ]);

    return new Response(
      JSON.stringify({
        logs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Audit logs API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
