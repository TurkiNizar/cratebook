type IconProps = React.SVGProps<SVGSVGElement>;

const defaults = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function CollectionIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 3.5v6.3M20.5 12h-6.3" opacity=".35" />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M20.8 8.7c0 5.4-8.8 10.2-8.8 10.2S3.2 14.1 3.2 8.7A4.6 4.6 0 0 1 12 6.8a4.6 4.6 0 0 1 8.8 1.9Z" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.2 20c.5-4 2.8-6 6.8-6s6.3 2 6.8 6" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}
