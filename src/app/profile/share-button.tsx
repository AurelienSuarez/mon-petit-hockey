"use client";

import { useState } from "react";

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const CARD_W = 1000;
const CARD_H = 1200;

export interface ShareStat {
  gender: "M" | "F";
  points: number;
  rank: number;
  total: number;
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawCard(canvas: HTMLCanvasElement, username: string, stats: ShareStat[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = CARD_W;
  canvas.height = CARD_H;

  const gradient = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  gradient.addColorStop(0, "#0f9d6c");
  gradient.addColorStop(1, "#d68a1a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = "700 30px system-ui, -apple-system, sans-serif";
  ctx.fillText("🏑  MON PETIT HOCKEY", CARD_W / 2, 110);

  ctx.beginPath();
  ctx.arc(CARD_W / 2, 270, 100, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "800 66px system-ui, -apple-system, sans-serif";
  ctx.fillText(username.slice(0, 2).toUpperCase(), CARD_W / 2, 293);

  ctx.font = "800 58px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#fff";
  ctx.fillText(username, CARD_W / 2, 445);

  const margin = 70;
  const gap = 26;
  const boxW = (CARD_W - margin * 2 - gap * (stats.length - 1)) / stats.length;
  const boxY = 520;
  const boxH = 460;

  stats.forEach((stat, i) => {
    const boxX = margin + i * (boxW + gap);
    roundRectPath(ctx, boxX, boxY, boxW, boxH, 28);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fill();

    const cx = boxX + boxW / 2;
    ctx.fillStyle = stat.gender === "F" ? "#ee7fbc" : "#7fa8f7";
    ctx.beginPath();
    ctx.arc(cx, boxY + 70, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "800 26px system-ui, sans-serif";
    ctx.fillText(stat.gender === "F" ? "F" : "H", cx, boxY + 79);

    ctx.font = "700 26px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(stat.gender === "F" ? "FEMMES" : "HOMMES", cx, boxY + 130);

    ctx.font = "800 72px system-ui, sans-serif";
    ctx.fillStyle = "#fff";
    const medal = MEDAL[stat.rank] ?? "";
    ctx.fillText(`${medal}`, cx, boxY + 240);
    ctx.font = "800 60px system-ui, sans-serif";
    ctx.fillText(`${stat.points} pts`, cx, medal ? boxY + 320 : boxY + 260);

    if (stat.rank > 0) {
      ctx.font = "600 30px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(`${stat.rank}${stat.rank === 1 ? "er" : "e"} sur ${stat.total}`, cx, boxY + boxH - 40);
    }
  });

  ctx.font = "500 24px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("mon-petit-hockey.cestfun.workers.dev", CARD_W / 2, CARD_H - 40);
}

export function ShareProfileButton({ username, stats }: { username: string; stats: ShareStat[] }) {
  const [status, setStatus] = useState<"idle" | "busy" | "shared" | "downloaded">("idle");

  async function shareImage() {
    setStatus("busy");
    const canvas = document.createElement("canvas");
    drawCard(canvas, username, stats);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setStatus("idle");
        return;
      }
      const file = new File([blob], "mon-petit-hockey.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Mon Petit Hockey" });
          setStatus("shared");
        } catch {
          setStatus("idle");
        }
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mon-petit-hockey.png";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("downloaded");
    }, "image/png");
  }

  return (
    <button type="button" className="player-card-share" onClick={shareImage} disabled={status === "busy"}>
      {status === "busy"
        ? "Génération..."
        : status === "shared"
          ? "✓ Partagé !"
          : status === "downloaded"
            ? "✓ Image enregistrée"
            : "📸 Partager en image"}
    </button>
  );
}
