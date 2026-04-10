import { intComma } from '@/utils/utils';

interface IStatProperties {
  value: string | number;
  description: string;
  className?: string;
  citySize?: number;
  onClick?: () => void;
  label?: string;
}

const Stat = ({
  value,
  description,
  className = '',
  citySize,
  onClick,
  label,
}: IStatProperties) => (
  <div 
    className={`ghibli-card p-3 shadow-sm cursor-pointer hover:shadow-ghibli ${className}`} 
    onClick={onClick}
  >
    {label && (
      <p className="text-ghibli-tan text-xs font-bold uppercase tracking-wider mb-1">
        {label}
      </p>
    )}
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-bold text-ghibli-text`}>
        {intComma(value.toString())}
      </span>
      {description && (
        <span className="text-sm font-semibold text-ghibli-accent">{description}</span>
      )}
    </div>
  </div>
);

export default Stat;
