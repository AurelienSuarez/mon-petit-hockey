# Mon Petit Hockey

Plateforme de pronostics façon MPP pour la Coupe du monde de hockey sur gazon 2026 (Belgique/Pays-Bas, 15–30 août). Comptes, ligues privées entre amis (via code d'invitation), liste des 100 matchs avec cotes calculées, et un système de points façon MPP.

HTML/CSS custom (pas de bibliothèque UI), avec un vrai système de design (palette, badges, cartes) — voir `src/app/globals.css`.

## Stack

- **Next.js 15** (App Router, TypeScript) — un seul projet pour l'UI et les routes serveur
- **Supabase** — Postgres géré + Auth (email/mot de passe) + Row Level Security
- **Cloudflare Workers** (via `@opennextjs/cloudflare`) — hébergement
- **Vitest** — tests unitaires sur les modules de calcul

## Structure

```
supabase/
  migrations/     schéma SQL versionné : tables, RLS, fonctions RPC
  seed/           équipes + calendrier complet des 100 matchs (transcrits du document
                   source) + script de seed
src/
  lib/
    tournament/   classements de poule, résolution des poules croisées E/F/G/H,
                  résolution des demi-finales/finale (avec tests)
    odds/         moteur de cotes : Elo -> Poisson -> marge (avec tests)
    scoring/      calcul des points façon MPP (avec tests)
    supabase/     clients Supabase (navigateur, serveur, admin) + types générés à la main
  app/            pages (auth, ligues, matchs, admin) + routes API
```

### Le format du tournoi

Le document source décrit un format inédit : 4 poules de 4 (premier tour), puis reversées
en 4 poules croisées E/F/G/H avec **report des points** du premier tour. C'est modélisé
avec une notation de "slot" (`A1` = 1er de la poule A, `E3` = 3e de la poule croisée E) —
voir `src/lib/tournament/slots.ts` et `resolve.ts` pour le détail. Le classement d'une
poule croisée est calculé en sommant tous les matchs déjà joués entre les 4 équipes du
groupe (premier tour + poules croisées), ce qui capture le report de points sans avoir à
coder les paires "reportées" à la main.

### Le moteur de cotes

Fidèle à la méthodologie du document fourni (partie 2/3) : Elo par équipe → buts attendus
via un modèle Poisson → probabilités 1N2 → marge appliquée par la **méthode "power"**
(favorise davantage les outsiders que les favoris, comme un vrai marché). En phase finale
(pas de nul possible), la probabilité de nul est redistribuée via un split shoot-out
~50-55/50-45 pondéré par l'Elo.

**Limite connue** : les Elo de départ (dans `supabase/seed/teams.ts`) sont des estimations
approximatives par palier, faute d'accès à une API publique du ranking FIH (le document le
signale explicitement). Ajustables à la main si besoin — chaque résultat saisi les fait de
toute façon évoluer.

### Les points (façon MPP)

Score exact = 5 pts · bon résultat + bon écart = 3 pts · bon résultat seul = 1 pt · faux = 0.
En phase finale, si tu pronostiques un score nul et que le match part aux tirs au but, un
point bonus est accordé si tu as aussi deviné le bon vainqueur du shoot-out.

## Setup en local

### 1. Créer un projet Supabase

Va sur [supabase.com](https://supabase.com), crée un compte et un nouveau projet (gratuit).
Dans **Project Settings → API**, récupère :
- Project URL
- `anon` `public` key
- `service_role` key (⚠️ ne jamais exposer côté client)

Copie `.env.local.example` vers `.env.local` et colle ces trois valeurs.

```bash
cp .env.local.example .env.local
```

> Astuce : par défaut Supabase exige une confirmation par email à l'inscription. Pour
> tester rapidement entre amis sans configurer d'envoi d'email, tu peux désactiver
> "Confirm email" dans **Authentication → Providers → Email** (à réactiver si tu ouvres
> l'appli plus largement).

### 2. Appliquer le schéma

Le plus simple sans installer la CLI Supabase : ouvre **SQL Editor** dans le dashboard
Supabase et colle le contenu de chaque fichier de `supabase/migrations/`, dans l'ordre
(0001, 0002, ...), en exécutant un fichier à la fois.

Avec la CLI Supabase (si installée) :

```bash
npx supabase link --project-ref <ton-project-ref>
npx supabase db push
```

### 3. Installer et seeder

```bash
npm install
npm run seed   # charge les 32 équipes + les 100 matchs + les cotes initiales
npm run dev    # http://localhost:3000
```

Le premier compte que tu crées n'est pas admin par défaut. Pour saisir des résultats
(`/admin/results`), passe `is_admin` à `true` sur ta ligne dans la table `profiles` via le
SQL Editor :

```sql
update profiles set is_admin = true where username = 'ton_pseudo';
```

### 4. Tests

```bash
npm run test   # moteurs de cotes, de points, de classements/résolution — 63 tests
npm run lint
```

## Déploiement sur Cloudflare

1. Crée un compte [Cloudflare](https://dash.cloudflare.com/sign-up) (gratuit).
2. Connecte la CLI (ouvre ton navigateur pour l'auth) :

   ```bash
   npx wrangler login
   ```

3. Vérifie que `.env.local` contient bien tes **vraies** valeurs Supabase (elles sont
   injectées dans le bundle au moment du build — `NEXT_PUBLIC_*` sont inlinées en dur,
   c'est normal et attendu).
4. Renseigne le secret côté serveur (uniquement `SUPABASE_SERVICE_ROLE_KEY`, jamais les
   variables `NEXT_PUBLIC_*` qui n'ont pas besoin d'être un secret runtime) :

   ```bash
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```

5. Build + déploiement :

   ```bash
   npm run deploy
   ```

`npm run preview` fait la même chose mais lance un aperçu local via `wrangler dev` plutôt
que de déployer.

### Pourquoi Next.js 15 (pas 16)

Next.js 16 a renommé `middleware` en `proxy` et l'exécute désormais uniquement en runtime
Node.js (l'option pour forcer le runtime Edge a été retirée). `@opennextjs/cloudflare`
(version actuelle) ne supporte pas encore ce mode. Le projet est donc épinglé sur
Next 15.5 (middleware Edge, pleinement supporté) — à remonter vers Next 16 une fois
qu'OpenNext ajoutera le support du runtime Node pour le proxy.

## Limites connues (v1)

- **Correction de résultat** : `/api/admin/results` refuse de retraiter un match déjà
  marqué "terminé" (pour éviter d'appliquer deux fois la mise à jour Elo). Corriger une
  erreur de saisie demande une intervention manuelle en base pour l'instant.
- **Invitations par lien uniquement** : pas d'envoi d'email automatique, volontairement
  (voir la conversation d'origine) — on partage le code à la main.
- **Règles de points par ligue** : le champ `leagues.scoring_rules` existe en base pour
  permettre une personnalisation future, mais il n'y a pas encore d'UI pour l'éditer —
  toutes les ligues utilisent les règles par défaut.
- **Ordre de la petite finale/finale** : le document source ne précise pas explicitement
  quel côté de la finale correspond à quelle demi-finale ; `supabase/seed/matches.ts`
  documente la convention retenue (SF1 vs SF2 des deux côtés).
- **Horaires incertains** : 3 matchs du calendrier source sont signalés par le document
  comme provenant d'une source secondaire ; ils sont marqués `time_uncertain` en base et
  affichés avec un ⚠️ dans l'UI.
