const STYLES: Record<string, string> = {
  GET: "bg-get/15 text-get border-get/30",
  POST: "bg-post/15 text-post border-post/30",
  PUT: "bg-put/15 text-put border-put/30",
  PATCH: "bg-patch/15 text-patch border-patch/30",
  DELETE: "bg-del/15 text-del border-del/30",
};

export default function MethodBadge({ method }: { method: string }) {
  const style = STYLES[method] ?? "bg-muted/15 text-muted border-muted/30";
  return (
    <span
      className={`inline-flex items-center justify-center w-[62px] shrink-0 rounded border px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide ${style}`}
    >
      {method}
    </span>
  );
}
