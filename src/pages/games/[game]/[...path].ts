import type { APIRoute } from 'astro';
import { getFileStream } from '../../../lib/storage';

export const GET: APIRoute = async ({ params }) => {
  const { game, path } = params;
  
  if (!game || !path) return new Response('Not found', { status: 404 });

  const gcsPath = `games/${game}/${path}`;

  try {
    // Basic MIME type inference (add a library like 'mime-types' for production)
    let contentType = 'application/octet-stream';
    if (path.endsWith('.html')) contentType = 'text/html';
    if (path.endsWith('.js')) contentType = 'application/javascript';
    if (path.endsWith('.css')) contentType = 'text/css';
    if (path.endsWith('.png')) contentType = 'image/png';
    if (path.endsWith('.json')) contentType = 'application/json';

    // Create the stream and handle potential errors
    const stream = getFileStream(gcsPath);
    
    // Add error handling for the stream
    return new Promise<Response>((resolve, reject) => {
      stream.on('error', (error) => {
        console.error(`Error streaming file ${gcsPath}:`, error);
        resolve(new Response('File not found', { status: 404 }));
      });

      // @ts-ignore - ReadableStream type mismatch between Node/Web standard
      resolve(new Response(stream, {
        headers: { 'Content-Type': contentType }
      }));
    });
  } catch (error) {
    console.error(`Error accessing file ${gcsPath}:`, error);
    return new Response('File not found', { status: 404 });
  }
};