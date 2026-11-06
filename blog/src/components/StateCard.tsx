import { Link } from 'react-router-dom';

interface StateCardProps {
  title: string;
  description?: string;
  to?: string;
  linkLabel?: string;
}

const StateCard = ({ title, description, to, linkLabel }: StateCardProps) => (
  <div className="card p-8 text-center">
    <p className="text-base font-bold text-ink">{title}</p>
    {description && <p className="mt-2 text-sm text-muted">{description}</p>}
    {to && (
      <Link
        to={to}
        className="mt-5 inline-flex rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted transition-colors hover:text-accentInk"
      >
        {linkLabel ?? '返回'}
      </Link>
    )}
  </div>
);

export default StateCard;
