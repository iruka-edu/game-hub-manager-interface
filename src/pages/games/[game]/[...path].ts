import type { APIRoute } from 'astro';
import { getFileStream } from '../../../lib/storage';

export const GET: APIRoute = async ({ params }) => {
  const { game, path } = params;
  
  if (!game || !path) return new Response('Not found', { status: 404 });

  const gcsPath = `games/${game}/${path}`;

  try {
    const stream = getFileStream(gcsPath);
    
    // Basic MIME type inference (add a library like 'mime-types' for production)
    let contentType = 'application/octet-stream';
    if (path.endsWith('.html')) contentType = 'text/html';
    if (path.endsWith('.js')) contentType = 'application/javascript';
    if (path.endsWith('.css')) contentType = 'text/css';
    if (path.endsWith('.png')) contentType = 'image/png';
    if (path.endsWith('.json')) contentType = 'application/json';

    // @ts-ignore - ReadableStream type mismatch between Node/Web standard
    return new Response(stream, {
      headers: { 'Content-Type': contentType }
    });
  } catch (e) {
    return new Response('File not found', { status: 404 });
  }
};