"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23eef1f4'/%3E%3Cpath d='M30 82V38h60v44H30Zm0-8 18-20 14 14 10-10 18 20' fill='none' stroke='%234f7399' stroke-width='3'/%3E%3C/svg%3E";

/** Replace a failed source once without depending on another network request. */
export function SafeImage({ src, alt = "", fallbackSrc, ...props }: ImgHTMLAttributes<HTMLImageElement> & { fallbackSrc?: string }) {
  const [failedSource, setFailedSource] = useState<string>();
  const [failedFallback, setFailedFallback] = useState<string>();
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (src && image.current?.complete && image.current.naturalWidth === 0) setFailedSource(String(src));
  }, [src]);
  const failed = !src || failedSource === src;
  const fallback = fallbackSrc && failedFallback !== fallbackSrc ? fallbackSrc : placeholder;
  return <img {...props} ref={image} src={failed ? fallback : src} alt={alt} data-image-fallback={failed || undefined} onError={!failed ? () => setFailedSource(String(src)) : fallback !== placeholder ? () => setFailedFallback(fallbackSrc) : undefined} />;
}
