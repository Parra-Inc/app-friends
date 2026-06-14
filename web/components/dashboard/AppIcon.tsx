export function AppIcon({
  src,
  name,
  size = 44,
}: {
  src: string | null;
  name: string;
  size?: number;
}) {
  if (src) {
    // External app-store CDN icons — plain img avoids next/image domain config.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className="shrink-0 rounded-xl border border-rule object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl bg-brand-soft font-semibold text-brand"
      style={{ width: size, height: size }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
