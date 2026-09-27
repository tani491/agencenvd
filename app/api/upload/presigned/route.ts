import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  R2_ALLOWED_MIME_TYPES,
  R2_UPLOAD_MAX_BYTES,
  getMissingR2EnvNames,
  getPresignedUploadUrl,
  isR2UploadConfigured,
  sanitizeUploadFileName
} from "@/lib/r2";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(180),
  fileType: z.enum(R2_ALLOWED_MIME_TYPES),
  fileSize: z.number().int().positive().max(R2_UPLOAD_MAX_BYTES).optional(),
  folder: z.enum(["portfolio", "hero", "quotes", "logos"]).default("quotes")
});

type UploadPayload = z.infer<typeof uploadRequestSchema>;

export async function POST(request: Request) {
  try {
    const payload = normalizeUploadRequest(await request.json());
    const r2Upload = await createR2PresignedUpload(payload);

    if (r2Upload) {
      return NextResponse.json({
        success: true,
        ...r2Upload,
        storage: "r2",
        uploadMode: "presigned"
      });
    }

    const supabaseUpload = await createSupabaseSignedUpload(payload);

    return NextResponse.json({
      success: true,
      ...supabaseUpload,
      storage: "supabase",
      uploadMode: "signed"
    });
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { success: false, error: "Fichier invalide.", issues },
        { status: 400 }
      );
    }

    console.warn("Upload presigned fallback unavailable", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de préparer l'upload du fichier."
      },
      { status: 400 }
    );
  }
}

function normalizeUploadRequest(body: unknown) {
  if (!body || typeof body !== "object") {
    return uploadRequestSchema.parse(body);
  }

  const payload = body as Record<string, unknown>;

  return uploadRequestSchema.parse({
    fileName: payload.fileName ?? payload.filename,
    fileType: payload.fileType ?? payload.contentType,
    fileSize: payload.fileSize,
    folder: payload.folder ?? "quotes"
  });
}

async function createR2PresignedUpload(payload: UploadPayload) {
  if (!isR2UploadConfigured()) {
    console.warn("R2 upload is not configured, falling back to Supabase Storage", {
      missingEnv: getMissingR2EnvNames()
    });
    return null;
  }

  try {
    return await getPresignedUploadUrl(
      payload.fileName,
      payload.fileType,
      payload.folder
    );
  } catch (error) {
    console.warn("R2 presigned upload failed, falling back to Supabase Storage", error);
    return null;
  }
}

async function createSupabaseSignedUpload(payload: UploadPayload) {
  const supabase = getSupabaseAdminClient();
  const path = buildSupabaseStoragePath(payload);
  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUploadUrl(path);

  if (error) {
    throw new Error(
      `Fallback Supabase Signed Upload impossible: ${error.message}. Vérifiez que le bucket "media" existe.`
    );
  }

  const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(path);

  if (!publicUrlData.publicUrl) {
    throw new Error("Fallback Supabase Storage terminé sans URL publique.");
  }

  return {
    uploadUrl: data.signedUrl,
    signedUrl: data.signedUrl,
    publicUrl: publicUrlData.publicUrl,
    path,
    key: path,
    token: data.token
  };
}

function buildSupabaseStoragePath(payload: UploadPayload) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeFileName = withSafeExtension(
    sanitizeUploadFileName(payload.fileName),
    payload.fileType
  ).slice(-120);

  return `${payload.folder}/${year}/${month}/${Date.now()}-${randomUUID()}-${safeFileName}`;
}

function withSafeExtension(fileName: string, fileType: UploadPayload["fileType"]) {
  if (/\.[a-z0-9]+$/i.test(fileName)) {
    return fileName;
  }

  const extensionByMimeType: Record<UploadPayload["fileType"], string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/quicktime": "mov"
  };

  return `${fileName}.${extensionByMimeType[fileType]}`;
}
