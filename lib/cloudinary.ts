import { createHash } from "node:crypto";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function createCloudinaryUploadSignature(folder: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const cloudName = requireEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requireEnv("CLOUDINARY_API_KEY");
  const apiSecret = requireEnv("CLOUDINARY_API_SECRET");
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(`${paramsToSign}${apiSecret}`)
    .digest("hex");

  return {
    cloudName,
    apiKey,
    folder,
    timestamp,
    signature
  };
}
