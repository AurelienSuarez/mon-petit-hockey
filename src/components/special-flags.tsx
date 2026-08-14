/**
 * England/Scotland/Wales have no ISO 3166-1 code, so no regional-indicator emoji flag
 * — their real flag is a Unicode "tag sequence" with unreliable font support (renders
 * as a broken glyph on plenty of devices, confirmed on Windows Chrome). Drawing the
 * three as small inline SVGs sidesteps font/emoji support entirely — same result
 * everywhere, no fallback needed.
 */

function FlagFrame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 30 20" width="1.4rem" height="0.95rem" style={{ borderRadius: "2px", display: "block" }}>
      {children}
    </svg>
  );
}

export function EnglandFlag() {
  return (
    <FlagFrame>
      <rect width="30" height="20" fill="#fff" />
      <rect x="12" width="6" height="20" fill="#ce1124" />
      <rect y="7" width="30" height="6" fill="#ce1124" />
    </FlagFrame>
  );
}

export function ScotlandFlag() {
  return (
    <FlagFrame>
      <rect width="30" height="20" fill="#0065bd" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" strokeWidth="4.5" />
    </FlagFrame>
  );
}

export function WalesFlag() {
  return (
    <FlagFrame>
      <rect width="30" height="10" fill="#fff" />
      <rect y="10" width="30" height="10" fill="#00b140" />
      {/* Simplified dragon silhouette (body + head) — legible at badge size, unlike a
          detailed outline which just reads as noise this small. */}
      <ellipse cx="16" cy="10" rx="6" ry="3.4" fill="#c8102e" transform="rotate(-15 16 10)" />
      <circle cx="9.5" cy="8.3" r="2.1" fill="#c8102e" />
      <path d="M8 6.7 L6.3 5.6 L7.6 8.1 Z" fill="#c8102e" />
    </FlagFrame>
  );
}

export const SPECIAL_FLAGS: Record<string, () => React.ReactElement> = {
  Angleterre: EnglandFlag,
  Écosse: ScotlandFlag,
  "Pays de Galles": WalesFlag,
};
