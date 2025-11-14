import React, { useEffect, useState } from "react";

interface TransparentImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  tolerance?: number; // 0-255, higher = more pixels treated as white
  colorDiff?: number; // max difference between rgb channels to consider "white"
}

export default function TransparentImage({
  src,
  alt,
  className,
  tolerance = 240,
  colorDiff = 10,
  ...rest
}: TransparentImageProps) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      if (cancelled) return;
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return; // canvas not supported
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Only modify opaque (or semi-opaque) pixels
          if (a === 0) continue;

          // Check if pixel is near-white: all channels above tolerance
          const isNearWhite = r >= tolerance && g >= tolerance && b >= tolerance;

          // Check that channels are similar (not colorful pixel that's bright)
          const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));

          if (isNearWhite && maxDiff <= colorDiff) {
            // set alpha to 0 -> transparent
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const out = canvas.toDataURL("image/png");
        setProcessedSrc(out);
      } catch (e) {
        // security or CORS error - fall back to original
        setProcessedSrc(src);
      }
    };

    img.onerror = () => {
      if (cancelled) return;
      setProcessedSrc(src);
    };

    return () => {
      cancelled = true;
    };
  }, [src, tolerance, colorDiff]);

  return (
    <img
      src={processedSrc || src}
      alt={alt}
      className={className}
      draggable={false}
      {...rest}
    />
  );
}
