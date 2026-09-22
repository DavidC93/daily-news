import { Source } from "@/lib/types";

export default function SourceList({ sources }: { sources: Source[] }) {
  if (!sources || sources.length === 0) return null;
  const label = sources.length === 1 ? "מקור" : "מקורות";

  return (
    <p className="text-xs text-ink-faint mt-2">
      {label}:{" "}
      {sources.map((s, i) => (
        <span key={s.id ?? s.url}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="bidi-latin underline decoration-hairline hover:text-accent hover:decoration-accent"
          >
            {s.name}
          </a>
          {i < sources.length - 1 ? ", " : ""}
        </span>
      ))}
    </p>
  );
}
