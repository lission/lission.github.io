import { MoonIcon, SunIcon } from '@/components/icons';
import { useTheme } from '@/hooks/useTheme';

const ThemeToggle = () => {
  const { mode, toggle } = useTheme();
  const isDark = mode === 'dark';
  const Icon = isDark ? MoonIcon : SunIcon;
  const title = isDark ? '深色' : '浅色';
  const next = isDark ? '切换到浅色' : '切换到深色';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`当前主题：${title}。${next}`}
      title={`${title} · ${next}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:text-accentInk"
    >
      <Icon size={18} />
    </button>
  );
};

export default ThemeToggle;
