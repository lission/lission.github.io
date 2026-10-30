interface IconProps {
  size?: number;
  className?: string;
}

const svgProps = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
});

export const CalendarIcon = ({ size = 20, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 2v4" />
    <path d="M16 2v4" />
  </svg>
);

export const FootprintsIcon = ({ size = 20, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" />
    <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" />
    <path d="M16 17h4" />
    <path d="M4 13h4" />
  </svg>
);

export const MapIcon = ({ size = 20, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
    <path d="M15 5.764v15" />
    <path d="M9 3.236v15" />
  </svg>
);

export const HeartIcon = ({ size = 20, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

export const ClockIcon = ({ size = 20, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export const SunriseIcon = ({ size = 20, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <path d="M12 2v8" />
    <path d="m4.93 10.93 1.41 1.41" />
    <path d="m19.07 10.93-1.41 1.41" />
    <path d="M2 18h20" />
    <path d="m8 22-4-4" />
    <path d="m16 22 4-4" />
    <path d="M12 18v4" />
  </svg>
);

export const SunIcon = ({ size = 20, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
  </svg>
);

export const CloudSunIcon = ({ size = 20, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <path d="M12 2v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="M20 12h2" />
    <path d="m19.07 4.93-1.41 1.41" />
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M16 14v2" />
    <path d="M14 18v.01" />
    <path d="M16 20v.01" />
    <path d="M18 16v.01" />
  </svg>
);

export const SunsetIcon = ({ size = 20, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <path d="M12 2v4" />
    <path d="m4.93 10.93 1.41 1.41" />
    <path d="m19.07 10.93-1.41 1.41" />
    <path d="M2 18h20" />
    <path d="M6 18a6 6 0 0 1 12 0" />
  </svg>
);

export const MoonIcon = ({ size = 20, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export const BuildingIcon = ({ size = 20, className }: IconProps) => (
  <svg {...svgProps(size, className)}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12h12" />
    <path d="M6 17h12" />
    <path d="M10 7h.01" />
    <path d="M14 7h.01" />
    <path d="M10 11h.01" />
    <path d="M14 11h.01" />
  </svg>
);
