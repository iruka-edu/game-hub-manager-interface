import type { APIRoute } from "astro";

export const prerender = false;

const UPSTREAM =
  import.meta.env.IRUKA_API_BASE ??
  "https://iruka-api-1037337851453.asia-southeast1.run.app";

export const GET: APIRoute = async ({ params, request }) => {
  const rest = params.path ?? ""; // ví dụ: "age-bands", "courses/a/b"

  const url = new URL(`${UPSTREAM}/api/v1/games/${rest}`);

  // Forward query string nếu có
  const reqUrl = new URL(request.url);
  reqUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  console.log("[proxy]", url.toString()); // <- sẽ thấy ở terminal khi route hit

  const upstreamRes = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  const body = await upstreamRes.arrayBuffer();

  return new Response(body, {
    status: upstreamRes.status,
    headers: {
      "content-type": upstreamRes.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
};
