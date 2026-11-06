interface FilterPillsProps {
  label?: string;
  options: string[];
  value: string;
  onChange: (_value: string) => void;
  allLabel?: string;
}

const pillClass = (active: boolean) =>
  'rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 ' +
  (active
    ? 'bg-accent text-onAccent shadow-sm'
    : 'border border-line bg-surface text-muted hover:-translate-y-0.5 hover:border-accent/40 hover:text-accentInk');

const FilterPills = ({
  label,
  options,
  value,
  onChange,
  allLabel = '全部',
}: FilterPillsProps) => {
  if (!options.length && !label) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && <span className="mr-1 text-xs font-bold text-muted">{label}</span>}
      <button type="button" className={pillClass(!value)} onClick={() => onChange('')}>
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          type="button"
          key={option}
          className={pillClass(value === option)}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default FilterPills;
