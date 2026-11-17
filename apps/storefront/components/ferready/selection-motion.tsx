"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { Icon } from "./shell";

export function MotionButton({ onPointerDown, onKeyDown, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} onPointerDown={(event) => { event.currentTarget.dataset.modality = "pointer"; onPointerDown?.(event); }} onKeyDown={(event) => { event.currentTarget.dataset.modality = "keyboard"; onKeyDown?.(event); }} />;
}

export function AddButton({ children, onClick, ...props }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & { onClick: (event: MouseEvent<HTMLButtonElement>) => boolean }) {
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function confirm(event: MouseEvent<HTMLButtonElement>) {
    clearTimeout(timer.current);
    setAdded(onClick(event));
    timer.current = setTimeout(() => setAdded(false), 1200);
  }
  return <MotionButton {...props} data-added={added} onClick={confirm}>
    {children}<span className="selection-feedback-icon" aria-hidden="true"><span><Icon name="plus" size={20} /></span><span><Icon name="check" size={20} /></span></span>
  </MotionButton>;
}
