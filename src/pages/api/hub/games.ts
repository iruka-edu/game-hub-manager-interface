import type { APIRoute } from 'astro';
import { PublicRegistryManager } from '../../../lib/public-registry';
import type { PublicGameEntry } from '../../../lib/public-registry-types';

/**
 * GET /api/hub/games
 * Public API endpoint for Game Hub to fetch available games
 * Returns only published and enabled games from the Public Registry
 * 
 * Query parameters:
 * - userId: Optional user ID for rollout filtering
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    // Get the Public Registry
    const registry = await PublicRegistryManager.get();

    let games: PublicGameEntry[];

    // Apply rollout filtering if userId is provided
    if (userId) {
      games = PublicRegistryManager.getForUser(registry, userId);
    } else {
      // Return all games (full rollout only)
      games = registry.games.filter(g => g.rolloutPercentage === 100);
    }

    // Set CORS headers for Game Hub access
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // In production, restrict to Game Hub domain
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    };

    return new Response(JSON.stringify({
      success: true,
      games,
      count: games.length,
      generatedAt: registry.generatedAt,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Hub games API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      games: [],
      count: 0,
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

/**
 * OPTIONS /api/hub/games
 * Handle CORS preflight requests
 */
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};
