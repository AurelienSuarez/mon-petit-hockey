import { teamCode, teamColor } from "@/lib/team-codes";
import { slotLabel } from "@/lib/tournament/labels";

export function TeamLabel({ name, slot }: { name: string | null; slot: string | null }) {
  if (name) {
    return (
      <span className="team">
        <span className="team-swatch" style={{ background: teamColor(name) }}>
          {teamCode(name)}
        </span>
        {name}
      </span>
    );
  }

  return <span className="muted">{slot ? slotLabel(slot) : "?"}</span>;
}
