export function CodeBlock({
  code,
  lang,
}: {
  code: string;
  lang?: string;
}) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-rule">
      {lang ? (
        <div className="border-b border-rule bg-paper-raised px-4 py-1.5 text-xs text-muted">
          {lang}
        </div>
      ) : null}
      <pre className="overflow-x-auto bg-ink p-4 text-[13px] leading-relaxed text-[#E9E5FF]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Endpoint({
  method,
  path,
}: {
  method: "GET" | "POST" | "DELETE" | "PATCH";
  path: string;
}) {
  const tone =
    method === "GET"
      ? "bg-positive/15 text-positive"
      : method === "POST"
        ? "bg-brand-soft text-brand"
        : "bg-accent-soft text-accent";
  return (
    <div className="my-3 flex items-center gap-3 rounded-xl border border-rule bg-paper-raised px-4 py-2.5">
      <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${tone}`}>
        {method}
      </span>
      <code className="font-mono text-sm text-ink">{path}</code>
    </div>
  );
}
