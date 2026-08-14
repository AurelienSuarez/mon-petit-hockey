import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/nav-bar";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = {
  metadataBase: new URL("https://mon-petit-hockey.cestfun.workers.dev"),
  title: "Mon Petit Hockey",
  description: "Pronostics entre amis pour la Coupe du monde de hockey 2026",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="fr">
      <body>
        <NavBar isLoggedIn={!!user} />
        <main className={user ? "has-bottom-nav" : undefined}>{children}</main>
        {user && <BottomNav />}
      </body>
    </html>
  );
}
