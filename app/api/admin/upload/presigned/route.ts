import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getAdminAuthState } from "@/lib/admin/auth";
import {
  R2_ALLOWED_MIME_TYPES,
  R2_UPLOAD_MAX_BYTES,
  getMissingR2EnvNames,
  getPresignedUploadUrl,
  isR2UploadConfigured,
  sanitizeUploadFileName,
  uploadBufferToR2
} from "@/lib/r2";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const adminUploadRequestSchema = z.object({
  fileName: z.string().min(1).max(180),
  fileType: z.enum(R2_ALLOWED_MIME_TYPES),
  fileSize: z.number().int().positive().max(R2_UPLOAD_MAX_BYTES).optional(),
  folder: z.enum(["portfolio", "hero", "quotes", "logos"]).default("portfolio")
});

type AdminUploadPayload = z.infer<typeof adminUploadRequestSchema>;

export async function POST(request: Request) {
  try {
    const admin = await getAdminAuthState();

    if (!admin.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Non autorisé." },
        { status: 401 }
      );
    }

    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      return handleDirectMediaUpload(request);
    }

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

    console.warn("Admin upload presigned fallback unavailable", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Impossible de préparer l'upload média.")
      },
      { status: 400 }
    );
  }
}

function normalizeUploadRequest(body: unknown) {
  if (!body || typeof body !== "object") {
    return adminUploadRequestSchema.parse(body);
  }

  const payload = body as Record<string, unknown>;

  return adminUploadRequestSchema.parse({
    fileName: payload.fileName ?? payload.filename,
    fileType: payload.fileType ?? payload.contentType,
    fileSize: payload.fileSize,
    folder: payload.folder ?? "portfolio"
  });
}

async function createR2PresignedUpload(payload: AdminUploadPayload) {
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

async function createSupabaseSignedUpload(payload: AdminUploadPayload) {
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

  const publicUrl = getSupabasePublicUrl(path);

  return {
    uploadUrl: data.signedUrl,
    signedUrl: data.signedUrl,
    publicUrl,
    path,
    key: path,
    token: data.token
  };
}

async function handleDirectMediaUpload(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier valide n'a été reçu." },
        { status: 400 }
      );
    }

    const payload = adminUploadRequestSchema.parse({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      folder: formData.get("folder") ?? "portfolio"
    });
    const body = Buffer.from(await file.arrayBuffer());

    const upload = await uploadDirectMedia(payload, body);

    return NextResponse.json({
      success: true,
      ...upload
    });
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { success: false, error: "Fichier invalide.", issues },
        { status: 400 }
      );
    }

    console.warn("Admin media direct upload unavailable", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Upload média impossible pour le moment.")
      },
      { status: 400 }
    );
  }
}

async function uploadDirectMedia(payload: AdminUploadPayload, body: Buffer) {
  if (isR2UploadConfigured()) {
    try {
      const upload = await uploadBufferToR2({
        fileName: payload.fileName,
        contentType: payload.fileType,
        body,
        folder: payload.folder
      });

      return {
        ...upload,
        storage: "r2",
        uploadMode: "direct"
      };
    } catch (error) {
      console.warn("R2 direct upload failed, falling back to Supabase Storage", error);
    }
  }

  const upload = await uploadToSupabaseStorage(payload, body);

  return {
    ...upload,
    storage: "supabase",
    uploadMode: "direct"
  };
}

async function uploadToSupabaseStorage(
  payload: AdminUploadPayload,
  body: Buffer
) {
  const supabase = getSupabaseAdminClient();
  const path = buildSupabaseStoragePath(payload);
  const { data, error } = await supabase.storage.from("media").upload(path, body, {
    cacheControl: "31536000",
    contentType: payload.fileType,
    upsert: false
  });

  if (error) {
    throw new Error(
      `Fallback Supabase Storage impossible: ${error.message}. Vérifiez que le bucket public "media" existe.`
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from("media")
    .getPublicUrl(data.path);

  if (!publicUrlData.publicUrl) {
    throw new Error("Fallback Supabase Storage terminé sans URL publique.");
  }

  return {
    publicUrl: publicUrlData.publicUrl,
    path: data.path,
    key: data.path
  };
}

function buildSupabaseStoragePath(payload: AdminUploadPayload) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeFolder = payload.folder
    .split("/")
    .map((segment) => segment.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
    .filter(Boolean)
    .join("/");
  const safeFileName = withSafeExtension(
    sanitizeUploadFileName(payload.fileName),
    payload.fileType
  ).slice(-120);

  return `${safeFolder || "portfolio"}/${year}/${month}/${Date.now()}-${randomUUID()}-${safeFileName}`;
}

function withSafeExtension(fileName: string, fileType: AdminUploadPayload["fileType"]) {
  if (/\.[a-z0-9]+$/i.test(fileName)) {
    return fileName;
  }

  const extensionByMimeType: Record<AdminUploadPayload["fileType"], string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/quicktime": "mov"
  };

  return `${fileName}.${extensionByMimeType[fileType]}`;
}

function getSupabasePublicUrl(path: string) {
  const supabase = getSupabaseAdminClient();
  const { data } = supabase.storage.from("media").getPublicUrl(path);

  if (!data.publicUrl) {
    throw new Error("Fallback Supabase Storage terminé sans URL publique.");
  }

  return data.publicUrl;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
