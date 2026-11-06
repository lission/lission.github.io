import type { ReactNode } from 'react';
import { BookOpenIcon, FeatherIcon, InfoIcon, ListChecksIcon } from '@/components/icons';

/** 各内容页用不同线描图标，风格统一（stroke 2 / currentColor / accentInk）。 */
const HEADER_ICONS = {
  reading: BookOpenIcon,
  notes: FeatherIcon,
  books: ListChecksIcon,
  about: InfoIcon,
} as const;

type HeaderIconName = keyof typeof HEADER_ICONS;

interface PageHeaderProps {
  icon?: HeaderIconName;
  title: string;
  description?: string;
  extra?: ReactNode;
}

const PageHeader = ({ icon, title, description, extra }: PageHeaderProps) => {
  const Icon = icon ? HEADER_ICONS[icon] : null;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold leading-tight text-ink sm:text-3xl">
            {Icon && (
              <span aria-hidden="true" className="inline-flex shrink-0 text-accentInk">
                <Icon size={28} />
              </span>
            )}
            {title}
          </h1>
          {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        </div>
        {extra}
      </div>
    </div>
  );
};

export default PageHeader;
