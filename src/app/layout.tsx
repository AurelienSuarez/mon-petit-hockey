import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/nav-bar";

export const metadata: Metadata = {
  title: "Prono Hockey CM 2026",
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
        <main>{children}</main>
      </body>
    </html>
  );
}
