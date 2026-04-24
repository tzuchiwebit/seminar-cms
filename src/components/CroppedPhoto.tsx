"use client";

import { useEffect, useState, type CSSProperties } from "react";

export type CropParams = { zoom: number; x: number; y: number };

/**
 * Renders an image cropped/positioned according to `crop` inside a square container.
 *
 * Crop model (scale-invariant; same params render identically at any display size):
 *   - zoom: scalar ≥ 1 (further zoom beyond object-cover)
 *   - x, y: % of container (pan offset, range depends on source aspect & zoom)
 *
 * At zoom = 1 the image is cover-fitted; pan is available in the longer dimension
 * of non-square sources, so users can reposition the auto-crop.
 */
export function CroppedPhoto({
  src,
  crop,
  className = "",
  alt = "",
}: {
  src: string;
  crop?: CropParams | null;
  className?: string;
  alt?: string;
}) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = src;
    return () => { cancelled = true; };
  }, [src]);

  let imgStyle: CSSProperties;
  if (natural && natural.w > 0 && natural.h > 0) {
    const aspect = natural.w / natural.h;
    const coverW = Math.max(aspect, 1);
    const coverH = Math.max(1 / aspect, 1);
    const zoom = crop?.zoom ?? 1;
    const imgW = coverW * zoom * 100;
    const imgH = coverH * zoom * 100;
    const imgLeft = (100 - imgW) / 2 + (crop?.x ?? 0);
    const imgTop = (100 - imgH) / 2 + (crop?.y ?? 0);
    imgStyle = {
      position: "absolute",
      width: `${imgW}%`,
      height: `${imgH}%`,
      left: `${imgLeft}%`,
      top: `${imgTop}%`,
      maxWidth: "none",
    };
  } else {
    imgStyle = {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
    };
  }

  return (
    <div className={`${className} overflow-hidden relative`}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="pointer-events-none block"
        style={imgStyle}
      />
    </div>
  );
}

/** Compute max pan in % of container, given source aspect and zoom. */
export function computeMaxPan(aspect: number, zoom: number) {
  const coverW = Math.max(aspect, 1);
  const coverH = Math.max(1 / aspect, 1);
  return {
    x: Math.max(0, (coverW * zoom - 1) * 50),
    y: Math.max(0, (coverH * zoom - 1) * 50),
  };
}
