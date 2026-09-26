import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuthState } from "@/lib/admin/auth";
import { createCloudinaryUploadSignature } from "@/lib/cloudinary";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const signatureRequestSchema = z.object({
  folder: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9/_-]+$/i)
    .default("nvd/admin-media")
});

export async function POST(request: Request) {
  const admin = await getAdminAuthState();

  if (!admin.isAdmin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = signatureRequestSchema.parse(await request.json());

    return NextResponse.json(createCloudinaryUploadSignature(body.folder));
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { error: "Dossier Cloudinary invalide.", issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de signer l'upload Cloudinary." },
      { status: 500 }
    );
  }
}
