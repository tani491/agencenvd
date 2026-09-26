import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

export const R2_UPLOAD_MAX_BYTES = 80 * 1024 * 1024;

export const R2_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime"
] as const;

export type R2AllowedMimeType = (typeof R2_ALLOWED_MIME_TYPES)[number];

const extensionByMimeType: Record<R2AllowedMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov"
};

type DeleteObjectCommandConstructor = new (input: {
  Bucket: string;
  Key: string;
}) => unknown;

type S3ClientWithSend = S3Client & {
  send: (command: unknown) => Promise<unknown>;
};

function requireEnv(name: string, aliases: string[] = []) {
  const names = [name, ...aliases];
  const value = names.map((key) => process.env[key]).find(Boolean);

  if (!value) {
    throw new Error(`Missing environment variable: ${names.join(" or ")}`);
  }

  return value;
}

export function getR2BucketName() {
  return requireEnv("CLOUDFLARE_R2_BUCKET_NAME", ["CLOUDFLARE_R2_BUCKET"]);
}

export function getR2Client() {
  return new S3Client(getR2ClientConfig());
}

function getR2ClientConfig() {
  const accountId = requireEnv("CLOUDFLARE_R2_ACCOUNT_ID");

  return {
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
    }
  };
}

export async function getPresignedUploadUrl(filename: string, contentType: string) {
  if (!isAllowedR2MimeType(contentType)) {
    throw new Error(`Unsupported R2 upload content type: ${contentType}`);
  }

  const key = buildR2ObjectKey(filename, contentType);
  const cacheControl = "public, max-age=31536000, immutable";
  const expiresIn = 300;
  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: key,
    ContentType: contentType,
    CacheControl: cacheControl,
    Metadata: {
      source: "nvd-upload",
      original_filename: filename.slice(0, 120)
    }
  });
  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn });

  return {
    uploadUrl,
    publicUrl: buildPublicR2Url(key),
    key,
    expiresIn,
    requiredHeaders: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl
    }
  };
}

export async function deleteR2Object(fileKey: string) {
  const normalizedKey = fileKey.replace(/^\/+/, "");

  if (!normalizedKey) {
    throw new Error("Missing R2 object key");
  }

  const { DeleteObjectCommand } = (await import("@aws-sdk/client-s3")) as unknown as {
    DeleteObjectCommand: DeleteObjectCommandConstructor;
  };

  await (getR2Client() as S3ClientWithSend).send(new DeleteObjectCommand({
    Bucket: getR2BucketName(),
    Key: normalizedKey
  }));
}

export function buildR2ObjectKey(fileName: string, fileType: R2AllowedMimeType) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const extension = getSafeExtension(fileName, fileType);

  return `quotes/${year}/${month}/${randomUUID()}.${extension}`;
}

export function buildPublicR2Url(key: string) {
  const publicBaseUrl = requireEnv("NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL", [
    "CLOUDFLARE_R2_PUBLIC_URL"
  ]).replace(/\/$/, "");

  return `${publicBaseUrl}/${key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

export function isAllowedR2MimeType(value: string): value is R2AllowedMimeType {
  return R2_ALLOWED_MIME_TYPES.includes(value as R2AllowedMimeType);
}

function getSafeExtension(fileName: string, fileType: R2AllowedMimeType) {
  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  const expectedExtension = extensionByMimeType[fileType];

  if (!extension) {
    return expectedExtension;
  }

  if (fileType === "image/jpeg" && ["jpg", "jpeg"].includes(extension)) {
    return extension;
  }

  if (extension === expectedExtension) {
    return extension;
  }

  return expectedExtension;
}
