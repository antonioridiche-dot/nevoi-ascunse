export function CatalogMark({ className = "" }: { className?: string }) {
  return (
    <span className={`catalog-mark ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
