/** Четыре иконки инлайном; цвет наследуется через currentColor. */

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function FeedIcon() {
  return (
    <svg {...base}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="14" y2="17" />
    </svg>
  );
}

export function FriendsIcon() {
  return (
    <svg {...base}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5" />
      <path d="M17.5 15.2c2 .7 3.5 2.2 3.5 4.8" />
    </svg>
  );
}

/** Лупа с силуэтом: две группы фигур рядом в шапке на 22 пикселях не различались. */
export function PeopleIcon() {
  return (
    <svg {...base}>
      <circle cx="10.5" cy="10.5" r="7" />
      <line x1="15.5" y1="15.5" x2="20.5" y2="20.5" />
      <circle cx="10.5" cy="8.5" r="1.9" />
      <path d="M7 14.5c0-2 1.6-3 3.5-3s3.5 1 3.5 3" />
    </svg>
  );
}

export function LogoutIcon() {
  return (
    <svg {...base}>
      <path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
      <path d="M17 15l4-3-4-3" />
      <line x1="21" y1="12" x2="10" y2="12" />
    </svg>
  );
}
