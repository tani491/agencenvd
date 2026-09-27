import { NextResponse } from "next/server";
import { z } from "zod";
import {
  R2_ALLOWED_MIME_TYPES,
  R2_UPLOAD_MAX_BYTES,
  getMissingR2EnvNames,
  getPresignedUploadUrl,
  isMissingR2ConfigError
} from "@/lib/r2";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(180),
  fileType: z.enum(R2_ALLOWED_MIME_TYPES),
  fileSize: z.number().int().positive().max(R2_UPLOAD_MAX_BYTES)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = uploadRequestSchema.parse(body);
    const presignedUpload = await getPresignedUploadUrl(
      payload.fileName,
      payload.fileType
    );

    return NextResponse.json(presignedUpload);
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { error: "Fichier invalide.", issues },
        { status: 400 }
      );
    }

    if (isMissingR2ConfigError(error)) {
      console.warn("R2 upload is not configured", error);

      return NextResponse.json(
        {
          code: "UPLOAD_STORAGE_NOT_CONFIGURED",
          error:
            "L'upload média n'est pas configuré. Renseignez les variables Cloudflare R2 dans .env.local puis redémarrez Next.js.",
          missingEnv: getMissingR2EnvNames()
        },
        { status: 503 }
      );
    }

    console.error("R2 presigned upload error", error);

    return NextResponse.json(
      { error: "Impossible de préparer l'upload du fichier." },
      { status: 500 }
    );
  }
}
