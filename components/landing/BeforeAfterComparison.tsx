"use client";

import { useState } from "react";
import Image from "next/image";
import { MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type BeforeAfterComparisonProps = {
  title: string;
  category?: string;
  beforeMediaUrl: string;
  afterMediaUrl: string;
  mediaType?: "image" | "video";
  priority?: boolean;
  className?: string;
};

export function BeforeAfterComparison({
  title,
  category,
  beforeMediaUrl,
  afterMediaUrl,
  mediaType = "image",
  priority = false,
  className
}: BeforeAfterComparisonProps) {
  const [position, setPosition] = useState(52);

  return (
    <article className={cn("overflow-hidden rounded-lg border border-cyan-100 bg-white shadow-nvd-soft", className)}>
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        <ComparisonMedia
          src={beforeMediaUrl}
          alt={`${title} avant nettoyage vapeur`}
          type={mediaType}
          priority={priority}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <ComparisonMedia
            src={afterMediaUrl}
            alt={`${title} après nettoyage vapeur NVD`}
            type={mediaType}
            priority={priority}
          />
        </div>

        <div className="absolute left-4 top-4 rounded-md bg-nvd-blue-dark/84 px-3 py-1 text-xs font-bold uppercase tracking-normal text-white">
          Après
        </div>
        <div className="absolute right-4 top-4 rounded-md bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-normal text-nvd-blue-dark">
          Avant
        </div>

        <div
          className="absolute inset-y-0 w-1 bg-white shadow-[0_0_0_1px_rgba(15,44,89,0.25)]"
          style={{ left: `${position}%` }}
        />
        <div
          className="absolute top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-nvd-blue-primary text-white shadow-lg"
          style={{ left: `${position}%` }}
          aria-hidden="true"
        >
          <MoveHorizontal className="h-5 w-5" />
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          aria-label={`Comparer avant et après pour ${title}`}
        />
      </div>

      <div className="grid gap-2 p-4">
        {category && (
          <p className="text-xs font-black uppercase tracking-normal text-nvd-blue-primary">
            {category}
          </p>
        )}
        <h2 className="text-lg font-black leading-6 text-nvd-blue-dark">{title}</h2>
      </div>
    </article>
  );
}

function ComparisonMedia({
  src,
  alt,
  type,
  priority
}: {
  src: string;
  alt: string;
  type: "image" | "video";
  priority: boolean;
}) {
  if (type === "video") {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        muted
        loop
        playsInline
        autoPlay
        aria-label={alt}
      >
        <source src={src} />
      </video>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 620px"
      className="object-cover"
    />
  );
}
