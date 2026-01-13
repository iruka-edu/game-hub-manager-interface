import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { getUserRepository } from "@/lib/repository-manager";

// In-memory cache for GCS data (in production, use Redis)
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getAuthenticatedUser(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("iruka_session");

  if (!sessionCookie?.value) {
    return null;
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    return null;
  }

  const userRepo = await getUserRepository();
  return userRepo.findById(session.userId);
}

function getCacheKey(userId: string, type: string): string {
  return `gcs:${type}:${userId}`;
}

function isExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp > entry.ttl;
}

/**
 * GET /api/gcs/cache
 * Get cached GCS data
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!currentUser.roles.includes("admin")) {
      return NextResponse.json(
        { error: "Forbidden. Only Admin can access GCS cache." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'files';
    
    const cacheKey = getCacheKey(currentUser._id.toString(), type);
    const entry = cache.get(cacheKey);

    if (!entry || isExpired(entry)) {
      return NextResponse.json({
        success: false,
        cached: false,
        message: "No valid cache found",
      });
    }

    return NextResponse.json({
      success: true,
      cached: true,
      data: entry.data,
      cachedAt: new Date(entry.timestamp).toISOString(),
      expiresAt: new Date(entry.timestamp + entry.ttl).toISOString(),
    });

  } catch (error) {
    console.error("[GCS Cache] Get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gcs/cache
 * Set cache data
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!currentUser.roles.includes("admin")) {
      return NextResponse.json(
        { error: "Forbidden. Only Admin can manage GCS cache." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type = 'files', data, ttl = CACHE_TTL } = body;

    if (!data) {
      return NextResponse.json(
        { error: "Data is required" },
        { status: 400 }
      );
    }

    const cacheKey = getCacheKey(currentUser._id.toString(), type);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    cache.set(cacheKey, entry);

    return NextResponse.json({
      success: true,
      message: "Cache updated successfully",
      cachedAt: new Date(entry.timestamp).toISOString(),
      expiresAt: new Date(entry.timestamp + entry.ttl).toISOString(),
    });

  } catch (error) {
    console.error("[GCS Cache] Set error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gcs/cache
 * Clear cache
 */
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!currentUser.roles.includes("admin")) {
      return NextResponse.json(
        { error: "Forbidden. Only Admin can manage GCS cache." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (type) {
      // Clear specific cache type
      const cacheKey = getCacheKey(currentUser._id.toString(), type);
      cache.delete(cacheKey);
    } else {
      // Clear all cache for user
      const userPrefix = `gcs:${currentUser._id.toString()}:`;
      for (const key of cache.keys()) {
        if (key.includes(userPrefix)) {
          cache.delete(key);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: type ? `Cache cleared for type: ${type}` : "All cache cleared",
    });

  } catch (error) {
    console.error("[GCS Cache] Clear error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}