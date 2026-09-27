import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { z } from "zod";
import { getAdminAuthState } from "@/lib/admin/auth";
import {
  R2_ALLOWED_MIME_TYPES,
  R2_UPLOAD_MAX_BYTES,
  buildR2ObjectKey,
  getMissingR2EnvNames,
  getPresignedUploadUrl,
  isMissingR2ConfigError,
  isR2UploadConfigured,
  uploadBufferToR2
} from "@/lib/r2";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const adminUploadRequestSchema = z.object({
  fileName: z.string().min(1).max(180),
  fileType: z.enum(R2_ALLOWED_MIME_TYPES),
  fileSize: z.number().int().positive().max(R2_UPLOAD_MAX_BYTES),
  folder: z.enum(["portfolio", "hero", "quotes"]).default("portfolio")
});

type AdminUploadPayload = z.infer<typeof adminUploadRequestSchema>;

export async function POST(request: Request) {
  const admin = await getAdminAuthState();

  if (!admin.isAdmin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      return handleDirectMediaUpload(request);
    }

    const payload = adminUploadRequestSchema.parse(await request.json());

    if (!isR2UploadConfigured()) {
      return NextResponse.json(
        {
          code: "UPLOAD_R2_NOT_CONFIGURED",
          error:
            "Cloudflare R2 n'est pas configuré. Le CMS média peut utiliser le fallback Supabase Storage avec un envoi multipart/form-data.",
          fallback: "supabase",
          missingEnv: getMissingR2EnvNames()
        },
        { status: 503 }
      );
    }

    const presignedUpload = await getPresignedUploadUrl(
      payload.fileName,
      payload.fileType,
      payload.folder
    );

    return NextResponse.json({
      ...presignedUpload,
      storage: "r2",
      uploadMode: "presigned"
    });
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { error: "Fichier invalide.", issues },
        { status: 400 }
      );
    }

    if (isMissingR2ConfigError(error)) {
      return NextResponse.json(
        {
          code: "UPLOAD_R2_NOT_CONFIGURED",
          error:
            "Cloudflare R2 n'est pas configuré. Utilisez l'upload direct du CMS pour activer le fallback Supabase Storage.",
          fallback: "supabase",
          missingEnv: getMissingR2EnvNames()
        },
        { status: 503 }
      );
    }

    console.error("Admin R2 presigned upload error", error);

    return NextResponse.json(
      { error: getErrorMessage(error, "Impossible de préparer l'upload média.") },
      { status: 500 }
    );
  }
}

async function handleDirectMediaUpload(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Aucun fichier valide n'a été reçu." },
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

  try {
    const upload = await uploadDirectMedia(payload, body);

    return NextResponse.json(upload);
  } catch (error) {
    console.error("Admin media direct upload error", error);

    return NextResponse.json(
      { error: getErrorMessage(error, "Upload média impossible pour le moment.") },
      { status: 500 }
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
  const path = buildR2ObjectKey(payload.fileName, payload.fileType, payload.folder);
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
    key: data.path
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
