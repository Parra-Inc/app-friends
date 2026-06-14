/** A small phone frame showing a promo popup — used to illustrate the network. */
export function PhoneMock({
  hostName,
  hostColor,
  promoName,
  promoColor,
  promoTagline,
  sponsored = false,
}: {
  hostName: string;
  hostColor: string;
  promoName: string;
  promoColor: string;
  promoTagline: string;
  sponsored?: boolean;
}) {
  return (
    <div className="relative w-[200px] shrink-0 rounded-[2rem] border-[6px] border-ink/90 bg-paper-raised shadow-xl">
      {/* status bar */}
      <div className="flex items-center justify-between px-4 pt-3 text-[10px] text-muted">
        <span>9:41</span>
        <span>{hostName}</span>
      </div>
      {/* host app faux content */}
      <div className="space-y-2 p-4 pt-3">
        <div className="h-2.5 w-3/4 rounded-full" style={{ background: hostColor, opacity: 0.5 }} />
        <div className="h-2 w-full rounded-full bg-rule" />
        <div className="h-2 w-5/6 rounded-full bg-rule" />
        <div className="h-24 w-full rounded-xl bg-rule/60" />
        <div className="h-2 w-2/3 rounded-full bg-rule" />
      </div>
      {/* promo popup */}
      <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-rule bg-paper-raised p-3 shadow-lg">
        {sponsored ? (
          <span className="mb-1 inline-block rounded-full bg-accent-soft px-1.5 py-0.5 text-[8px] font-semibold uppercase text-accent">
            Sponsored
          </span>
        ) : null}
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 shrink-0 rounded-xl"
            style={{ background: promoColor }}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-semibold text-ink">
              {promoName}
            </div>
            <div className="truncate text-[9px] text-muted">{promoTagline}</div>
          </div>
          <div
            className="rounded-full px-2.5 py-1 text-[9px] font-semibold text-white"
            style={{ background: promoColor }}
          >
            Get
          </div>
        </div>
      </div>
    </div>
  );
}
