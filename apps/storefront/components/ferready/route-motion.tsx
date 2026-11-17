"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Animate committed content without remounting it or taking over navigation. */
export function RouteMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const surface = useRef<HTMLDivElement>(null);
  const keyboard = useRef(false);
  const animation = useRef<Animation | null>(null);

  useLayoutEffect(() => {
    const onPointer = () => { keyboard.current = false; };
    const onKeyboard = () => {
      keyboard.current = true;
      animation.current?.cancel();
    };
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKeyboard, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKeyboard, true);
      animation.current?.cancel();
    };
  }, []);

  useLayoutEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    animation.current?.cancel();
    if (!surface.current || keyboard.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const easing = getComputedStyle(surface.current).getPropertyValue("--selection-ease-out").trim();
    animation.current = surface.current.animate(
      [{ opacity: 0.45, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 220, easing: easing || "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
    return () => animation.current?.cancel();
  }, [pathname]);

  return <div ref={surface} className="route-surface">{children}</div>;
}
