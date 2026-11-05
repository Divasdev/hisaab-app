// Hisaab's own small icon set, drawn on a 20px grid: 2px strokes, square ends, sharp corners.
// Icons are used only where a word cannot go (back, close, copy, show password...).
// Categories, group kinds and activity types use words instead of pictures.
const P = {
  plus: <path d="M10 3.5v13M3.5 10h13" />,
  minus: <path d="M3.5 10h13" />,
  x: <path d="M4.5 4.5l11 11M15.5 4.5l-11 11" />,
  check: <path d="M3.5 10.5l4 4 9-9" />,
  chevronLeft: <path d="M12.5 3.5 6 10l6.5 6.5" />,
  chevronRight: <path d="M7.5 3.5 14 10l-6.5 6.5" />,
  chevronDown: <path d="M3.5 7.5 10 14l6.5-6.5" />,
  arrowRight: <path d="M3 10h13M11 5l5 5-5 5" />,
  copy: <path d="M6.5 6.5h10v10h-10ZM3.5 13.5v-10h10" />,
  share: <path d="M10 13V2.5M6 6.5l4-4 4 4M3.5 10v7.5h13V10" />,
  link: <path d="M8.5 11.5l3-3M11 5.5l1.5-1.5a3.2 3.2 0 0 1 4.5 4.5L15.5 10M9 14.5 7.5 16a3.2 3.2 0 0 1-4.5-4.5L4.5 10" />,
  trash: <path d="M3 5.5h14M8 5.5v-3h4v3M5 5.5l1 12h8l1-12" />,
  pencil: <path d="M3.5 16.5l1-4 9-9 3 3-9 9ZM11.5 5.5l3 3" />,
  calendar: <path d="M3 4.5h14v12.5H3ZM3 8.5h14M7 2.5v4M13 2.5v4" />,
  info: <path d="M10 2.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15ZM10 9v5M10 6v.5" />,
  more: <path d="M4.5 10h1M9.5 10h1M14.5 10h1" />,
  undo: <path d="M7 4 3 8l4 4M3 8h9.5a4.5 4.5 0 0 1 0 9H8" />,
  refresh: <path d="M16.5 3.5v4h-4M16 7.5A6.5 6.5 0 1 0 16.5 12" />,
  logOut: <path d="M8 3.5H3.5v13H8M12.5 6l4 4-4 4M16.5 10H7" />,
  smartphone: <path d="M5.5 2h9v16h-9ZM9 15h2" />,
  eye: <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10ZM10 7.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />,
  eyeOff: <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10ZM10 7.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 3l14 14" />,
  userPlus: <path d="M7.5 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM2 17v-1.5a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4V17M16 6.5v5M13.5 9h5" />,
};

export function Icon({ name, size = 20, strokeWidth = 2, className, ...rest }) {
  const path = P[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {path}
    </svg>
  );
}
