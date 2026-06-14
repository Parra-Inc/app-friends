import type { DailyPoint } from "@/lib/network/analytics";

/** Dependency-free SVG bar chart: views received + installs per day. */
export function ActivityChart({ data }: { data: DailyPoint[] }) {
  const width = 760;
  const height = 200;
  const pad = { top: 12, right: 12, bottom: 22, left: 12 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const max = Math.max(
    1,
    ...data.map((d) => Math.max(d.impressionsReceived, d.impressionsGiven))
  );
  const n = data.length || 1;
  const slot = innerW / n;
  const barW = Math.max(2, Math.min(14, slot * 0.5));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[640px]"
        role="img"
        aria-label="Activity over time"
      >
        {/* baseline */}
        <line
          x1={pad.left}
          y1={pad.top + innerH}
          x2={pad.left + innerW}
          y2={pad.top + innerH}
          stroke="var(--rule)"
        />
        {data.map((d, i) => {
          const x = pad.left + i * slot + slot / 2;
          const recvH = (d.impressionsReceived / max) * innerH;
          const giveH = (d.impressionsGiven / max) * innerH;
          return (
            <g key={d.day}>
              <rect
                x={x - barW - 1}
                y={pad.top + innerH - recvH}
                width={barW}
                height={recvH}
                rx={2}
                fill="var(--brand)"
                opacity={0.85}
              />
              <rect
                x={x + 1}
                y={pad.top + innerH - giveH}
                width={barW}
                height={giveH}
                rx={2}
                fill="var(--accent)"
                opacity={0.7}
              />
              {i % 5 === 0 ? (
                <text
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--muted)"
                >
                  {d.day.slice(5)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Views received
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Views given
        </span>
      </div>
    </div>
  );
}
