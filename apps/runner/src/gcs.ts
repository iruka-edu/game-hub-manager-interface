import { Storage } from "@google-cloud/storage";
import path from "path";
import fs from "fs";

function getPrivateKey() {
  // Private key trong .env thường có dạng "\n" -> cần replace thành newline thật
  const raw = process.env.GCLOUD_PRIVATE_KEY || "";
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

function getStorage() {
  const projectId = process.env.GCLOUD_PROJECT_ID;
  const clientEmail = process.env.GCLOUD_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing GCLOUD_* env vars (project/client_email/private_key)");
  }

  return new Storage({
    projectId,
    credentials: { client_email: clientEmail, private_key: privateKey },
  });
}

export async function uploadRunDirToGCS(params: {
  runId: string;
  runDir: string;
}): Promise<{ prefix: string }> {
  const bucketName = process.env.GCLOUD_BUCKET_NAME;
  if (!bucketName) throw new Error("Missing GCLOUD_BUCKET_NAME");

  const storage = getStorage();
  const bucket = storage.bucket(bucketName);

  // prefix bạn có thể đổi theo ý: runner/runs/<runId>/
  const prefix = `runner/runs/${params.runId}`;

  // upload đệ quy toàn bộ runDir
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else files.push(full);
    }
  };
  walk(params.runDir);

  await Promise.all(
    files.map(async (localPath) => {
      const rel = path.relative(params.runDir, localPath).replace(/\\/g, "/");
      const destination = `${prefix}/${rel}`;

      await bucket.upload(localPath, {
        destination,
        resumable: false,
        metadata: {
          cacheControl: rel.endsWith(".html") ? "no-cache" : "public, max-age=31536000",
        },
      });
    })
  );

  return { prefix };
}

export function makeGcsPublicUrl(objectPath: string) {
  // URL public theo kiểu storage.googleapis.com
  const bucket = process.env.GCLOUD_BUCKET_NAME!;
  return `https://storage.googleapis.com/${bucket}/${objectPath}`;
}