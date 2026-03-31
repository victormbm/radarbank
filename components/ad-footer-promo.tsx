"use client";

import { AdSenseSlot } from "@/components/adsense-slot";

export function AdFooterPromo() {
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER;

  if (!slotId) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t border-white/10">
      <div className="rounded-xl border border-slate-200/20 bg-gradient-to-r from-slate-900/50 via-blue-900/20 to-slate-900/50 backdrop-blur-sm p-4">
        <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider text-center">
          Patrocínio
        </p>
        <div className="flex justify-center min-h-[120px]">
          <AdSenseSlot
            slot={slotId}
            format="auto"
            className="w-full min-h-[90px]"
          />
        </div>
      </div>
    </div>
  );
}
