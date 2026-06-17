"use client";

import { useCallback, useRef, useState } from "react";

interface ShareButtonProps {
  url: string;
  label?: string;
  className?: string;
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy method
    }
  }

  if (typeof document === "undefined") return false;

  const input = document.createElement("input");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  input.setSelectionRange(0, text.length);

  let success = false;
  try {
    success = document.execCommand("copy");
  } catch {
    success = false;
  }

  document.body.removeChild(input);
  return success;
}

export function ShareButton({
  url,
  label = "Del",
  className = "",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(url);
    if (!success) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCopied(true);
    timeoutRef.current = setTimeout(() => setCopied(false), 1800);
  }, [url]);

  const buttonLabel = copied ? "Lenke kopiert" : label;

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Lenke kopiert" : `Kopier lenke: ${label}`}
      className={`inline-flex shrink-0 items-center rounded border border-stone-200 bg-white px-2 py-1 text-xs text-stone-500 transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-stone-800 ${className}`}
    >
      {buttonLabel}
    </button>
  );
}
