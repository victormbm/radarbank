"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

type AdSenseSlotProps = {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical" | "display";
  className?: string;
  width?: number;
  height?: number;
};

export function AdSenseSlot({ slot, format = "auto", className, width, height }: AdSenseSlotProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const fullWidth = !width && !height;
  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    if (!clientId) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore duplicate push errors caused by remounts.
    }
  }, [clientId, slot, width, height]);

  if (!clientId || !slot) {
    return null;
  }

  if (isDev) {
    return (
      <div className={className}>
        <div
          className="flex items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-xs text-slate-500"
          style={{
            minHeight: height ? `${height}px` : "90px",
            width: width ? `${width}px` : "100%",
          }}
        >
          Preview local AdSense ({format}) - slot {slot}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ 
          display: "block",
          ...(width && { width: `${width}px` }),
          ...(height && { height: `${height}px` })
        }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidth ? "true" : "false"}
      />
    </div>
  );
}
