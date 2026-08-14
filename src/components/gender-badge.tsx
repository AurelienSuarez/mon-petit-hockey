/**
 * Small filled dot with an H/F letter, standing in for the ♂/♀ glyphs previously used
 * directly in badge text — those render inconsistently (size, baseline, missing glyph
 * fallback) across phones/fonts, unlike a plain styled span.
 */
export function GenderBadge({ gender }: { gender: "M" | "F" }) {
  return (
    <span className={`gender-dot ${gender === "F" ? "gender-dot-f" : "gender-dot-m"}`}>
      {gender === "F" ? "F" : "H"}
    </span>
  );
}
