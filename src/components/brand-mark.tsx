type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className="brand" aria-label="Cratebook">
      <span className="brand-record" aria-hidden="true">
        <span />
      </span>
      {!compact && <span className="brand-name">Cratebook</span>}
    </span>
  );
}
