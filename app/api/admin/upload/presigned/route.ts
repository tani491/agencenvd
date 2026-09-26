import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuthState } from "@/lib/admin/auth";
import {
  R2_ALLOWED_MIME_TYPES,
  R2_UPLOAD_MAX_BYTES,
  getPresignedUploadUrl
} from "@/lib/r2";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const adminUploadRequestSchema = z.object({
  fileName: z.string().min(1).max(180),
  fileType: z.enum(R2_ALLOWED_MIME_TYPES),
  fileSize: z.number().int().positive().max(R2_UPLOAD_MAX_BYTES),
  folder: z.enum(["portfolio", "hero", "quotes"]).default("portfolio")
});

export async function POST(request: Request) {
  const admin = await getAdminAuthState();

  if (!admin.isAdmin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const payload = adminUploadRequestSchema.parse(await request.json());
    const presignedUpload = await getPresignedUploadUrl(
      payload.fileName,
      payload.fileType,
      payload.folder
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

    console.error("Admin R2 presigned upload error", error);

    return NextResponse.json(
      { error: "Impossible de préparer l'upload R2." },
      { status: 500 }
    );
  }
}
