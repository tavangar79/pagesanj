// Splits plain copy into word spans for the scroll-scrubbed reveal (DESIGN.md §8). The text and its
// spaces stay exactly as written, so crawlers and screen readers read the same sentence.
export function Words({ text, className = 'w' }: { text: string; className?: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, i) =>
        /^\s+$/.test(part) || part === '' ? (
          part
        ) : (
          <span key={i} className={className}>
            {part}
          </span>
        ),
      )}
    </>
  );
}
