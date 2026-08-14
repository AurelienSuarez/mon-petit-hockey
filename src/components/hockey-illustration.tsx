/**
 * Small line-art illustration for the login/register screens — a stick striking the
 * ball toward goal, with a motion arc. Pure CSS-variable colors so it stays readable
 * in both themes without a separate dark-mode asset.
 */
export function HockeyIllustration() {
  return (
    <svg viewBox="0 0 200 120" width="180" height="108" role="presentation" aria-hidden="true">
      <path
        d="M14 96 C 60 108, 140 108, 186 96"
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M100 100 Q 130 60 158 34"
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth="3"
        strokeDasharray="1 8"
        strokeLinecap="round"
        opacity="0.6"
      />

      <g transform="translate(30,20)">
        <path
          d="M4 2 C 2 26, 4 50, 22 68 L 34 76"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path d="M22 68 C 30 74, 44 74, 52 62" fill="none" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" />
      </g>

      <circle cx="100" cy="94" r="9" fill="var(--accent)" />

      <g stroke="var(--border-strong)" strokeWidth="3" strokeLinecap="round">
        <path d="M162 30 L 162 78" />
        <path d="M162 30 L 190 30 L 190 78" fill="none" />
        <path d="M162 40 L 186 40 M162 52 L 186 52 M162 64 L 186 64" opacity="0.5" />
      </g>
    </svg>
  );
}
