import type { APIRoute } from 'astro';
import { RegistryManager } from '../../../lib/registry';

export const GET: APIRoute = async () => {
  try {
    const registry = await RegistryManager.get();
    
    return new Response(JSON.stringify(registry), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('List games error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch games' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
