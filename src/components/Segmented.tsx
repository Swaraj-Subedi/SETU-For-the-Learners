export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
}

export interface SegmentedProps<T extends string> {
  label?: string;
  name: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}

export function Segmented<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
  className = '',
}: SegmentedProps<T>) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <span className="block text-xs uppercase font-medium tracking-label text-sage-ink select-none mb-2">
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        aria-label={label || name}
        className="flex flex-wrap gap-1.5 p-1 bg-paper/80 border border-sage/40 rounded-sm"
      >
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(opt.value)}
              className={`flex-1 min-w-[90px] py-2 px-3 text-center rounded-sm transition-all text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1 select-none ${
                isSelected
                  ? 'bg-ink text-ivory shadow-subtle'
                  : 'text-ink-soft hover:text-ink hover:bg-sage/15'
              }`}
            >
              <div>{opt.label}</div>
              {opt.sublabel && (
                <div
                  className={`text-[10px] mt-0.5 ${
                    isSelected ? 'text-ivory/70' : 'text-ink-soft/70'
                  }`}
                >
                  {opt.sublabel}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
