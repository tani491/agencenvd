const r2PublicUrl =
  process.env.CLOUDFLARE_R2_PUBLIC_URL ??
  process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL ??
  process.env.R2_PUBLIC_URL ??
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

const remotePatterns = [
  {
    protocol: "https",
    hostname: "images.unsplash.com"
  },
  {
    protocol: "https",
    hostname: "res.cloudinary.com"
  },
  {
    protocol: "https",
    hostname: "pub-your-bucket-id.r2.dev"
  },
  {
    protocol: "https",
    hostname: "**.r2.dev"
  },
  {
    protocol: "https",
    hostname: "**.r2.cloudflarestorage.com"
  },
  {
    protocol: "https",
    hostname: "**.supabase.co",
    pathname: "/storage/v1/object/public/**"
  }
];

if (r2PublicUrl) {
  try {
    const parsedR2PublicUrl = new URL(r2PublicUrl);
    remotePatterns.push({
      protocol: parsedR2PublicUrl.protocol.replace(":", ""),
      hostname: parsedR2PublicUrl.hostname
    });
  } catch {
    // The app can still build; API routes validate this env var at runtime.
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns
  }
};

export default nextConfig;
