"use client";

import { AdSenseSlot } from "@/components/adsense-slot";

export function AdSidebarPromo() {
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR;

  if (!slotId) {
    return null;
  }

  return (
    <div className="hidden lg:block">
      <div className="sticky top-8 space-y-4">
        <div className="rounded-xl border border-slate-200/40 bg-gradient-to-br from-slate-900/50 to-purple-900/30 backdrop-blur-sm p-4">
          <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">
            Anúncio
          </p>
          <div className="flex justify-center">
            <AdSenseSlot
              slot={slotId}
              format="auto"
              width={300}
              height={600}
              className="w-[300px] h-[600px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
