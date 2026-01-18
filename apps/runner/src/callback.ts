import crypto from "crypto";

function hmac(secret: string, body: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export async function sendCallback(opts: {
  callbackUrl: string;
  secret: string;
  payload: any;
}) {
  const body = JSON.stringify(opts.payload);
  const sig = opts.secret ? hmac(opts.secret, body) : "";

  const res = await fetch(opts.callbackUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(sig ? { "x-iruka-signature": sig } : {}),
    },
    body,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Callback failed: ${res.status} ${txt}`);
  }
}
