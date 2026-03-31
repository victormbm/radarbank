"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

type AdSenseSlotProps = {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical" | "display";
  className?: string;
  width?: number;
  height?: number;
};

// Em dev, defina NEXT_PUBLIC_ADSENSE_DEV_MODE=unfilled no .env.local
// para simular o estado sem preenchimento. Omita ou use =filled para simular preenchido.
const DEV_SIMULATE = process.env.NEXT_PUBLIC_ADSENSE_DEV_MODE ?? "filled";

export function AdSenseSlot({ slot, format = "auto", className, width, height }: AdSenseSlotProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const fullWidth = !width && !height;
  const isDev = process.env.NODE_ENV !== "production";
  const adFormat = format === "auto" || format === "fluid" ? format : "auto";
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "loading" | "filled" | "unfilled" | "error">("idle");

  const isUnfilled = status === "unfilled" || status === "error";

  useEffect(() => {
    if (!clientId || !slot || isDev) {
      return;
    }

    const adElement = adRef.current;
    if (!adElement) {
      return;
    }

    const currentStatus = adElement.getAttribute("data-ad-status");
    if (currentStatus === "filled") {
      setStatus("filled");
      return;
    }
    if (currentStatus === "unfilled") {
      setStatus("unfilled");
      return;
    }

    setStatus("loading");

    const observer = new MutationObserver(() => {
      const mutationStatus = adElement.getAttribute("data-ad-status");
      if (mutationStatus === "filled") {
        setStatus("filled");
      } else if (mutationStatus === "unfilled") {
        setStatus("unfilled");
      }
    });

    observer.observe(adElement, {
      attributes: true,
      attributeFilter: ["data-ad-status", "data-adsbygoogle-status"],
    });

    const pushAd = () => {
      if (pushedRef.current) {
        return;
      }

      if (!window.adsbygoogle) {
        return;
      }

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch {
        setStatus("error");
      }
    };

    pushAd();

    let pollAttempts = 0;
    const pollMaxAttempts = 30;
    const pollIntervalId = window.setInterval(() => {
      const polledStatus = adElement.getAttribute("data-ad-status");
      if (polledStatus === "filled") {
        setStatus("filled");
      } else if (polledStatus === "unfilled") {
        setStatus("unfilled");
      }

      if (polledStatus === "filled" || polledStatus === "unfilled") {
        window.clearInterval(pollIntervalId);
        return;
      }

      pushAd();

      pollAttempts += 1;
      if (pollAttempts >= pollMaxAttempts) {
        setStatus("unfilled");
        window.clearInterval(pollIntervalId);
      }
    }, 1000);

    const fallbackTimer = window.setTimeout(() => {
      const timeoutStatus = adElement.getAttribute("data-ad-status");
      if (timeoutStatus !== "filled") {
        setStatus("unfilled");
      }
    }, 12000);

    return () => {
      observer.disconnect();
      window.clearInterval(pollIntervalId);
      window.clearTimeout(fallbackTimer);
    };
  }, [clientId, slot, width, height, isDev]);

  if (!clientId || !slot) {
    return null;
  }

  if (isDev) {
    if (DEV_SIMULATE === "unfilled") {
      return (
        <div className={className}>
          <div
            className="flex items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-xs text-slate-500"
            style={{ minHeight: "60px" }}
          >
            Espaco publicitario indisponivel no momento.
          </div>
        </div>
      );
    }

    return (
      <div className={className}>
        <div
          className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-blue-300 bg-blue-50 px-3 text-xs text-blue-600"
          style={{
            minHeight: height ? `${height}px` : "90px",
            width: width ? `${width}px` : "100%",
          }}
        >
          <span className="font-semibold">AdSense [DEV]</span>
          <span>{width ? `${width}×${height}px` : "responsivo"} · slot {slot}</span>
          <span className="text-blue-400">NEXT_PUBLIC_ADSENSE_DEV_MODE=unfilled para simular sem preenchimento</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: isUnfilled ? "none" : "block",
          ...(width && { width: `${width}px` }),
          ...(height && { height: `${height}px` }),
        }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidth ? "true" : "false"}
      />
      {isUnfilled && (
        <div
          className="flex items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-xs text-slate-500"
          style={{ minHeight: "60px" }}
        >
          Espaco publicitario indisponivel no momento.
        </div>
      )}
    </div>
  );
}
