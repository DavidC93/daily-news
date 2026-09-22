export default function DailyBrief({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="mb-10 pb-8 border-b border-hairline">
      <h2 className="text-xs font-medium tracking-wide text-ink-faint mb-3">היום בקצרה</h2>
      <div className="text-ink-soft leading-loose text-[15px] sm:text-base whitespace-pre-line">
        {text}
      </div>
    </div>
  );
}
